/**
 * Agent 执行器
 *
 * 实现多步 Agent Loop：用户说一个目标 → AI 规划多步 → 逐条执行 →
 * 根据结果调整 → 完成后汇报。
 *
 * 核心循环：
 * 1. 采集远程机器上下文
 * 2. 发送给 AI，要求返回行动计划
 * 3. 逐步执行计划中的命令
 * 4. 将执行结果回传 AI，判断是否完成
 * 5. 未完成则重新规划，循环直到完成或达到上限
 */

import { getNLController, NLController } from './nlController';
import { getSSHService, SSHService } from './sshService';
import { getSecurityChecker, SecurityChecker } from './securityChecker';
import {
  CommandContext,
  RemoteContext,
  RiskLevel,
  AIRequestOptions,
} from '../types/nlc';

// ============================================================================
// Agent 类型定义
// ============================================================================

/** 单个执行步骤 */
export interface AgentStep {
  id: string;
  command: string;
  explanation: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
}

/** AI 生成的行动计划 */
export interface AgentPlan {
  thought: string;           // AI 的推理过程
  steps: AgentStep[];        // 有序步骤列表
  completionCriteria: string; // 完成标准
  summary?: string;          // 完成时的摘要（可选）
}

/** 步骤执行结果 */
export interface AgentStepResult {
  stepId: string;
  command: string;
  output: string;
  success: boolean;
  exitCode: number;
}

/** Agent 事件类型 */
export type AgentEvent =
  | { type: 'plan_created'; plan: AgentPlan }
  | { type: 'step_start'; stepIndex: number; step: AgentStep }
  | { type: 'step_output'; stepIndex: number; output: string }
  | { type: 'step_done'; stepIndex: number; result: AgentStepResult }
  | { type: 'step_needs_confirmation'; stepIndex: number; step: AgentStep }
  | { type: 'iteration_start'; iteration: number }
  | { type: 'agent_done'; summary: string; stepsExecuted: number }
  | { type: 'agent_error'; error: string }
  | { type: 'max_steps_reached'; stepsExecuted: number };

/** 事件回调 */
export type AgentEventCallback = (event: AgentEvent) => void;

/** 用户确认回调：返回 true 表示确认，false 表示取消 */
export type ConfirmCallback = (step: AgentStep) => Promise<boolean>;

// ============================================================================
// Agent Executor
// ============================================================================

export class AgentExecutor {
  private nlController: NLController;
  private sshService: SSHService;
  private securityChecker: SecurityChecker;
  private maxSteps: number;
  private maxIterations: number;
  private aborted: boolean = false;
  private totalStepsExecuted: number = 0;

  constructor(options?: { maxSteps?: number; maxIterations?: number }) {
    this.nlController = getNLController();
    this.sshService = getSSHService();
    this.securityChecker = getSecurityChecker();
    this.maxSteps = options?.maxSteps ?? 10;
    this.maxIterations = options?.maxIterations ?? 5;
  }

  /**
   * 运行 Agent Loop
   *
   * @param userRequest 用户的自然语言请求
   * @param context 命令上下文
   * @param sessionId SSH 会话 ID
   * @param onEvent 事件回调（用于 UI 更新）
   * @param onConfirm 用户确认回调（用于高风险命令确认）
   */
  async run(
    userRequest: string,
    context: CommandContext,
    sessionId: string,
    onEvent: AgentEventCallback,
    onConfirm?: ConfirmCallback,
  ): Promise<void> {
    this.aborted = false;
    this.totalStepsExecuted = 0;

    try {
      // 第一步：采集远程机器上下文
      let remoteContext: RemoteContext | undefined;
      try {
        remoteContext = await this.nlController.gatherContext(sessionId);
        console.log('远程上下文采集完成:', remoteContext);
      } catch (err) {
        console.warn('采集远程上下文失败，继续执行:', err);
      }

      // 将远程上下文注入 CommandContext
      const enrichedContext: CommandContext = {
        ...context,
        remoteContext,
      };

      // 累积的步骤结果（用于回传 AI 重新规划）
      let allStepResults: AgentStepResult[] = [];

      // Agent 主循环
      for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
        if (this.aborted) {
          onEvent({ type: 'agent_done', summary: '用户已中止执行', stepsExecuted: this.totalStepsExecuted });
          return;
        }

        onEvent({ type: 'iteration_start', iteration });

        // 构建发送给 AI 的提示词
        const prompt = this.buildAgentPrompt(userRequest, allStepResults, enrichedContext);

        // 请求 AI 生成行动计划
        let plan: AgentPlan;
        try {
          plan = await this.requestPlan(prompt, enrichedContext);
        } catch (error) {
          onEvent({
            type: 'agent_error',
            error: `AI 规划失败: ${error instanceof Error ? error.message : '未知错误'}`,
          });
          return;
        }

        // AI 判断任务已完成
        if (plan.steps.length === 0 || plan.summary) {
          onEvent({
            type: 'agent_done',
            summary: plan.summary || plan.thought,
            stepsExecuted: this.totalStepsExecuted,
          });
          return;
        }

        onEvent({ type: 'plan_created', plan });

        // 执行计划中的步骤
        let planFailed = false;
        for (let i = 0; i < plan.steps.length; i++) {
          if (this.aborted) {
            onEvent({ type: 'agent_done', summary: '用户已中止执行', stepsExecuted: this.totalStepsExecuted });
            return;
          }

          // 检查是否超过最大步数
          if (this.totalStepsExecuted >= this.maxSteps) {
            onEvent({ type: 'max_steps_reached', stepsExecuted: this.totalStepsExecuted });
            return;
          }

          const step = plan.steps[i];

          // 安全检查
          const securityResult = this.securityChecker.checkCommand(step.command);
          const needsConfirmation = securityResult.requiresConfirmation || step.requiresConfirmation;

          // 高风险命令需要用户确认
          if (needsConfirmation && onConfirm) {
            onEvent({ type: 'step_needs_confirmation', stepIndex: i, step });
            const confirmed = await onConfirm(step);
            if (!confirmed) {
              onEvent({
                type: 'agent_done',
                summary: `用户取消了步骤: ${step.explanation}`,
                stepsExecuted: this.totalStepsExecuted,
              });
              return;
            }
          }

          // 执行步骤
          onEvent({ type: 'step_start', stepIndex: i, step });

          const result = await this.executeStep(step, sessionId, i, onEvent);
          allStepResults.push(result);
          this.totalStepsExecuted++;

          onEvent({ type: 'step_done', stepIndex: i, result });

          // 非低风险命令失败时，中断当前计划让 AI 重新规划
          if (!result.success && step.riskLevel !== 'low') {
            console.log(`步骤 ${i + 1} 失败，中断计划让 AI 重新规划`);
            planFailed = true;
            break;
          }
        }

        // 所有步骤都成功完成，将结果回传 AI 做最终评估
        // 如果有步骤失败，也让 AI 重新规划
        if (!planFailed && allStepResults.length > 0) {
          // 所有步骤成功，发送最终评估请求
          const evalPrompt = this.buildEvaluationPrompt(userRequest, allStepResults, enrichedContext);
          try {
            const evalPlan = await this.requestPlan(evalPrompt, enrichedContext);
            if (evalPlan.steps.length === 0 || evalPlan.summary) {
              onEvent({
                type: 'agent_done',
                summary: evalPlan.summary || evalPlan.thought,
                stepsExecuted: this.totalStepsExecuted,
              });
              return;
            }
            // AI 认为还需要继续，进入下一轮迭代
          } catch {
            // 评估失败但步骤都成功了，当作完成
            onEvent({
              type: 'agent_done',
              summary: `已完成 ${this.totalStepsExecuted} 个步骤`,
              stepsExecuted: this.totalStepsExecuted,
            });
            return;
          }
        }
        // planFailed 时循环继续，下一轮迭代会重新规划
      }

      // 达到最大迭代次数
      onEvent({
        type: 'agent_done',
        summary: `已达到最大迭代次数 (${this.maxIterations})，共执行 ${this.totalStepsExecuted} 个步骤`,
        stepsExecuted: this.totalStepsExecuted,
      });
    } catch (error) {
      onEvent({
        type: 'agent_error',
        error: error instanceof Error ? error.message : 'Agent 执行出错',
      });
    }
  }

  /**
   * 中止 Agent 执行
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: AgentStep,
    sessionId: string,
    stepIndex: number,
    onEvent: AgentEventCallback,
  ): Promise<AgentStepResult> {
    try {
      const { output, timedOut } = await this.sshService.writeAndWait(
        sessionId,
        step.command,
        30000,
      );

      if (output) {
        onEvent({ type: 'step_output', stepIndex, output });
      }

      return {
        stepId: step.id,
        command: step.command,
        output: output || (timedOut ? '命令超时' : '无输出'),
        success: !timedOut,
        exitCode: timedOut ? -1 : 0,
      };
    } catch (error) {
      return {
        stepId: step.id,
        command: step.command,
        output: error instanceof Error ? error.message : '执行失败',
        success: false,
        exitCode: -1,
      };
    }
  }

  /**
   * 向 AI 请求行动计划
   */
  private async requestPlan(prompt: string, context: CommandContext): Promise<AgentPlan> {
    // 使用当前 AI 服务发送请求
    const aiService = this.nlController.getAIService();
    if (!aiService) {
      throw new Error('AI 服务未初始化');
    }

    const options: AIRequestOptions = {
      timeout: 30000,
      conversationHistory: context.conversationHistory,
    };

    const response = await aiService.sendRequest(prompt, options);
    return this.parseAgentPlan(response.rawResponse || JSON.stringify(response));
  }

  /**
   * 构建 Agent 模式的提示词
   */
  private buildAgentPrompt(
    userRequest: string,
    previousResults: AgentStepResult[],
    context: CommandContext,
  ): string {
    const { deviceInfo, remoteContext } = context;

    let prompt = `用户请求: ${userRequest}\n`;
    prompt += `目标系统: ${deviceInfo.os} (${deviceInfo.shell})\n`;

    if (remoteContext) {
      prompt += `当前目录: ${remoteContext.pwd}\n`;
      prompt += `当前用户: ${remoteContext.whoami}\n`;
      prompt += `系统信息: ${remoteContext.uname}\n`;
    }

    if (previousResults.length > 0) {
      prompt += `\n之前执行的结果:\n`;
      for (const r of previousResults) {
        prompt += `- 命令: ${r.command}\n`;
        prompt +=  `  输出: ${r.output.substring(0, 200)}${r.output.length > 200 ? '...' : ''}\n`;
        prompt += `  ${r.success ? '成功' : '失败'}\n`;
      }
    }

    prompt += `
请规划完成此任务需要执行的步骤。返回 JSON 格式：
{
  "thought": "你的推理过程",
  "steps": [
    {"id": "1", "command": "具体命令", "explanation": "这一步做什么", "riskLevel": "low"}
  ],
  "completionCriteria": "如何判断任务完成"
}

如果任务已完成，返回空步骤和摘要：
{"thought": "任务完成", "steps": [], "completionCriteria": "DONE", "summary": "完成摘要"}

风险等级说明：low=只读/安全操作, medium=需要sudo/修改文件, high=删除/系统操作, critical=格式化/不可逆操作`;

    return prompt;
  }

  /**
   * 构建评估提示词（步骤执行完毕后判断是否完成）
   */
  private buildEvaluationPrompt(
    userRequest: string,
    allResults: AgentStepResult[],
    _context: CommandContext,
  ): string {
    let prompt = `用户原始请求: ${userRequest}\n\n`;
    prompt += `已执行的所有步骤和结果:\n`;

    for (const r of allResults) {
      prompt += `- 命令: ${r.command}\n`;
      prompt += `  输出: ${r.output.substring(0, 300)}${r.output.length > 300 ? '...' : ''}\n`;
      prompt += `  ${r.success ? '成功' : '失败'}\n\n`;
    }

    prompt += `请判断任务是否已完成。如果完成，返回空步骤和 summary：
{"thought": "已完成", "steps": [], "completionCriteria": "DONE", "summary": "完成摘要"}

如果还需要继续，返回下一步的计划：
{"thought": "还需要...", "steps": [...], "completionCriteria": "..."}`;

    return prompt;
  }

  /**
   * 解析 AI 响应为行动计划
   * 复用 parseResponse 的健壮性：支持 JSON、代码块、纯文本提取
   */
  private parseAgentPlan(rawResponse: string): AgentPlan {
    console.log('解析 Agent 计划:', rawResponse.substring(0, 500));

    try {
      // 移除 <think> 标签
      let cleaned = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      // 尝试提取 JSON
      const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // 验证基本结构
        if (parsed.thought || parsed.steps) {
          return {
            thought: parsed.thought || '',
            steps: (parsed.steps || []).map((s: any, i: number) => ({
              id: s.id || String(i + 1),
              command: s.command || '',
              explanation: s.explanation || '',
              riskLevel: s.riskLevel || 'low',
              requiresConfirmation: s.riskLevel === 'high' || s.riskLevel === 'critical',
            })),
            completionCriteria: parsed.completionCriteria || '',
            summary: parsed.summary,
          };
        }
      }

      // 尝试从代码块提取
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        return {
          thought: parsed.thought || '',
          steps: (parsed.steps || []).map((s: any, i: number) => ({
            id: s.id || String(i + 1),
            command: s.command || '',
            explanation: s.explanation || '',
            riskLevel: s.riskLevel || 'low',
            requiresConfirmation: s.riskLevel === 'high' || s.riskLevel === 'critical',
          })),
          completionCriteria: parsed.completionCriteria || '',
          summary: parsed.summary,
        };
      }

      // 无法解析，当作纯文本完成响应
      console.warn('无法解析 Agent 计划，当作完成处理');
      return {
        thought: cleaned.substring(0, 200),
        steps: [],
        completionCriteria: 'DONE',
        summary: cleaned.substring(0, 500),
      };
    } catch (error) {
      console.error('解析 Agent 计划出错:', error);
      // 解析失败时返回完成状态，避免死循环
      return {
        thought: '解析 AI 响应失败',
        steps: [],
        completionCriteria: 'DONE',
        summary: rawResponse.substring(0, 500),
      };
    }
  }
}
