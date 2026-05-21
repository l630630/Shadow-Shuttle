import { auditLogStore } from '../../stores/auditLogStore';
import type { SkillContext, SkillInvocation, SkillResult } from './types';
import { getSkillRegistry } from './registry';

export interface DispatchOptions {
  /**
   * 如果 skill 需要确认，会回调这里；返回 true 才继续执行
   * （UI 层可以用 Alert 弹窗实现）
   */
  confirm?: (text: string) => Promise<boolean>;
}

export async function dispatchSkill(
  invocation: SkillInvocation,
  ctx: SkillContext,
  options?: DispatchOptions
): Promise<SkillResult> {
  const registry = getSkillRegistry();
  const skill = registry.get(invocation.skill);
  if (!skill) {
    throw new Error(`未知技能: ${invocation.skill}`);
  }

  const validated = skill.validate(invocation, ctx);
  if (!validated.ok || !validated.args) {
    throw new Error(validated.error || '技能参数不合法');
  }

  const normalizedInvocation: SkillInvocation = {
    skill: invocation.skill,
    args: validated.args,
  };

  let wasConfirmed = false;
  if (skill.requiresConfirmation) {
    const text =
      skill.buildConfirmationText?.(normalizedInvocation as any, ctx) ||
      `将执行技能：${skill.title}\n\n设备：${ctx.device.name}\n\n是否继续？`;

    const confirm = options?.confirm;
    if (!confirm) {
      throw new Error('该操作需要确认，但未提供确认回调');
    }
    wasConfirmed = await confirm(text);
    if (!wasConfirmed) {
      return { summary: '已取消执行。' };
    }
  }

  const start = Date.now();
  const result = await skill.execute(normalizedInvocation as any, ctx);
  const executionTime = Date.now() - start;

  // 记录审计日志（复用现有审计结构）
  await auditLogStore.addLog({
    id: `skill-${invocation.skill}-${Date.now()}`,
    timestamp: new Date(),
    deviceId: ctx.device.id,
    userInput: ctx.userInput,
    aiParsedCommand: `SKILL ${invocation.skill} ${JSON.stringify(normalizedInvocation.args)}`,
    executedCommand: result.executedCommand || '',
    output: result.output || result.summary,
    exitCode: 0,
    riskLevel: skill.riskLevel,
    wasConfirmed: skill.requiresConfirmation ? wasConfirmed : true,
    executionTime,
  });

  return result;
}

