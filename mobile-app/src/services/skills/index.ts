/**
 * Skills Registration
 * 技能注册
 *
 * Call registerAllSkills() once at app startup to register all available skills.
 */

import { getSkillRegistry } from './registry';
import { pptGeneratorSkill } from './pptGenerator';

export { getSkillRegistry } from './registry';
export { dispatchSkill } from './dispatcher';
export type { SkillDefinition, SkillInvocation, SkillResult, SkillContext } from './types';
export { pptGeneratorSkill } from './pptGenerator';
export { generateContent } from './contentGenerator';

/**
 * Register all built-in skills. Call once at app startup.
 */
export function registerAllSkills(): void {
  const registry = getSkillRegistry();
  registry.register(pptGeneratorSkill);
}
