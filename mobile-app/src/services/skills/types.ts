import type { Device } from '../../types/device';
import type { RiskLevel } from '../../types/nlc';

export type SkillId = string;

export interface SkillContext {
  device: Device;
  sshSessionId: string;
  /**
   * 原始用户输入（用于审计、回放、以及二次确认文案）
   */
  userInput: string;
}

export type SkillArgValue = string | number | boolean | null | SkillArgValue[] | { [k: string]: SkillArgValue };
export type SkillArgs = Record<string, SkillArgValue>;

export interface SkillInvocation<TArgs extends SkillArgs = SkillArgs> {
  skill: SkillId;
  args: TArgs;
}

export interface SkillResult {
  /**
   * 可展示给用户的简短文本（AI 助手气泡、终端输出、日志等）
   */
  summary: string;
  /**
   * 真实执行时发送到远端的命令（用于审计）
   */
  executedCommand?: string;
  /**
   * 可选：原始输出（如果能采集到）
   */
  output?: string;
}

export interface SkillValidationResult<TArgs extends SkillArgs = SkillArgs> {
  ok: boolean;
  args?: TArgs;
  error?: string;
}

export interface SkillDefinition<TArgs extends SkillArgs = SkillArgs> {
  id: SkillId;
  title: string;
  description: string;

  /**
   * 风险等级：用于 UI/审计、以及默认是否强制确认
   */
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;

  /**
   * 生成给用户看的确认文案（比“你确定吗”更具体）
   */
  buildConfirmationText?: (invocation: SkillInvocation<TArgs>, ctx: SkillContext) => string;

  /**
   * 对 args 做校验与归一化（比如 trim、默认值）
   */
  validate: (invocation: SkillInvocation, ctx: SkillContext) => SkillValidationResult<TArgs>;

  /**
   * 真正执行（通常通过 SSH 发送命令；也可以是本地动作）
   */
  execute: (invocation: SkillInvocation<TArgs>, ctx: SkillContext) => Promise<SkillResult>;
}

