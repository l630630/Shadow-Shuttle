/**
 * PPT Generator Skill
 * PPT 生成技能
 *
 * Uses AI to generate slide content from a topic description,
 * then runs python-pptx on the remote machine to create a .pptx file.
 *
 * Flow:
 * 1. AI generates structured JSON (title, slides with layout/bullets)
 * 2. Upload Python script + JSON to remote via SSH
 * 3. Run python3 generate_ppt.py slides.json output.pptx
 * 4. Return the output file path
 */

import { getSSHService } from '../sshService';
import { generateContent } from './contentGenerator';
import { getNLController } from '../nlController';
import type { SkillDefinition, SkillContext, SkillInvocation, SkillResult } from './types';

// The generate_ppt.py script is embedded as a string so the skill is self-contained.
// Rebuilt from mobile-app/src/services/skills/scripts/generate_ppt.py
const GENERATE_PPT_SCRIPT = String.raw`#!/usr/bin/env python3
import json, sys, os, subprocess

def install_pptx():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-pptx", "-q"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
except ImportError:
    print("Installing python-pptx...")
    install_pptx()
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN

C_PRIMARY = RGBColor(0x1A, 0x73, 0xE8)
C_DARK = RGBColor(0x20, 0x2A, 0x44)
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SW, SH = Inches(13.333), Inches(7.5)

def add_title_slide(prs, d):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid(); s.background.fill.fore_color.rgb = C_PRIMARY
    t = d.get("title", "")
    if t:
        tb = s.shapes.add_textbox(Inches(1.5), Inches(2.2), Inches(10.3), Inches(2))
        p = tb.text_frame.paragraphs[0]; p.text = t; p.font.size = Pt(44)
        p.font.bold = True; p.font.color.rgb = C_WHITE; p.alignment = PP_ALIGN.CENTER
    st = d.get("subtitle", "")
    if st:
        tb = s.shapes.add_textbox(Inches(2), Inches(4.5), Inches(9.3), Inches(1.2))
        p = tb.text_frame.paragraphs[0]; p.text = st; p.font.size = Pt(22)
        p.font.color.rgb = RGBColor(0xDD,0xDD,0xDD); p.alignment = PP_ALIGN.CENTER

def add_content_slide(prs, d):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bar = s.shapes.add_shape(1, Inches(0), Inches(0), SW, Inches(0.08))
    bar.fill.solid(); bar.fill.fore_color.rgb = C_PRIMARY; bar.line.fill.background()
    t = d.get("title", "")
    if t:
        tb = s.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.2))
        p = tb.text_frame.paragraphs[0]; p.text = t; p.font.size = Pt(32)
        p.font.bold = True; p.font.color.rgb = C_DARK
    bullets = d.get("bullets", [])
    if bullets:
        from pptx.oxml.ns import qn
        tb = s.shapes.add_textbox(Inches(1.2), Inches(2.0), Inches(10.9), Inches(5.0))
        tf = tb.text_frame; tf.word_wrap = True
        for i, b in enumerate(bullets):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = b; p.font.size = Pt(20); p.font.color.rgb = C_DARK; p.space_after = Pt(12)
            pPr = p._p.get_or_add_pPr()
            for e in pPr.findall(qn("a:buChar")): pPr.remove(e)
            pPr.append(pPr.makeelement(qn("a:buChar"), {"char": "•"}))

def add_two_column_slide(prs, d):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bar = s.shapes.add_shape(1, Inches(0), Inches(0), SW, Inches(0.08))
    bar.fill.solid(); bar.fill.fore_color.rgb = C_PRIMARY; bar.line.fill.background()
    t = d.get("title", "")
    if t:
        tb = s.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.2))
        p = tb.text_frame.paragraphs[0]; p.text = t; p.font.size = Pt(32)
        p.font.bold = True; p.font.color.rgb = C_DARK
    for col, x in [(d.get("left",[]), Inches(0.8)), (d.get("right",[]), Inches(6.8))]:
        if col:
            tb = s.shapes.add_textbox(x, Inches(2.0), Inches(5.6), Inches(5.0))
            tf = tb.text_frame; tf.word_wrap = True
            for i, item in enumerate(col):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                p.text = item; p.font.size = Pt(18); p.font.color.rgb = C_DARK; p.space_after = Pt(8)

def generate(data, out):
    prs = Presentation(); prs.slide_width = SW; prs.slide_height = SH
    for sd in data.get("slides", []):
        l = sd.get("layout", "content")
        if l == "title": add_title_slide(prs, sd)
        elif l == "two_column": add_two_column_slide(prs, sd)
        else: add_content_slide(prs, sd)
    prs.save(out); return out

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(1)
    json_path = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(json_path)[0] + ".pptx"
    with open(json_path, "r", encoding="utf-8") as f: data = json.load(f)
    print(f"PPT generated: {generate(data, out)}")
`;

const PPT_SYSTEM_PROMPT = `You are a presentation content generator. You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation outside the JSON).

The JSON must follow this exact structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "layout": "title",
      "title": "Main Title",
      "subtitle": "Optional subtitle"
    },
    {
      "layout": "content",
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "layout": "two_column",
      "title": "Slide Title",
      "left": ["Left item 1", "Left item 2"],
      "right": ["Right item 1", "Right item 2"]
    }
  ]
}

Layout types:
- "title": Opening/closing slide with centered title and optional subtitle
- "content": Standard slide with title and bullet points (5-8 bullets per slide)
- "two_column": Comparison or side-by-side content

Guidelines:
- Always start with a title slide
- End with a thank-you or summary title slide
- 5-10 slides total for a good presentation
- Keep bullet points concise (1-2 lines each)
- Use Chinese if the topic is in Chinese, otherwise English
- Make content professional and well-structured`;

export const pptGeneratorSkill: SkillDefinition<{ topic: string; outputPath?: string }> = {
  id: 'ppt-generator',
  title: '生成 PPT',
  description: '根据描述自动生成演示文稿 (.pptx)',
  riskLevel: 'low',
  requiresConfirmation: false,

  validate(invocation: SkillInvocation<{ topic: string; outputPath?: string }>) {
    const topic = invocation.args?.topic?.toString().trim();
    if (!topic) {
      return { ok: false, error: '请提供 PPT 主题描述' };
    }
    return {
      ok: true,
      args: {
        topic,
        outputPath: invocation.args?.outputPath?.toString().trim() || undefined,
      },
    };
  },

  async execute(
    invocation: SkillInvocation<{ topic: string; outputPath?: string }>,
    ctx: SkillContext,
  ): Promise<SkillResult> {
    const ssh = getSSHService();
    if (!ssh.isConnected(ctx.sshSessionId)) {
      return { summary: 'SSH 未连接，无法在远程机器上生成 PPT' };
    }

    const { topic, outputPath } = invocation.args;

    // 1. Get current AI provider
    const nlController = getNLController();
    const provider = nlController.getCurrentProvider();
    if (!provider) {
      return { summary: '未配置 AI 提供商，请先在设置中配置' };
    }

    // 2. Ask AI to generate slide content
    const aiResult = await generateContent(
      provider,
      PPT_SYSTEM_PROMPT,
      `请为以下主题生成一份 PPT：\n${topic}`,
      4096,
    );

    if (!aiResult.success) {
      return { summary: `AI 内容生成失败: ${aiResult.error}` };
    }

    // 3. Parse AI response - extract JSON from possible markdown wrapper
    let slidesJson: string;
    try {
      let cleaned = aiResult.content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      // Validate it's proper JSON
      JSON.parse(cleaned);
      slidesJson = cleaned;
    } catch {
      return { summary: 'AI 返回内容无法解析为 JSON，请重试' };
    }

    // 4. Determine output path
    const timestamp = Date.now();
    const remoteDir = '/tmp/shadow-shuttle-ppt';
    const jsonPath = `${remoteDir}/slides_${timestamp}.json`;
    const scriptPath = `${remoteDir}/generate_ppt.py`;
    const defaultOutput = `${remoteDir}/presentation_${timestamp}.pptx`;
    const finalOutput = outputPath || defaultOutput;

    // 5. Create directory and upload files via SSH
    const { output: mkdirOut } = await ssh.writeAndWait(ctx.sshSessionId, `mkdir -p ${remoteDir}`);
    await ssh.writeAndWait(ctx.sshSessionId, `cat > ${scriptPath} << 'PPT_SCRIPT_EOF'\n${GENERATE_PPT_SCRIPT}\nPPT_SCRIPT_EOF`);
    await ssh.writeAndWait(
      ctx.sshSessionId,
      `cat > ${jsonPath} << 'SLIDES_JSON_EOF'\n${slidesJson}\nSLIDES_JSON_EOF`,
    );

    // 6. Ensure python-pptx is installed
    const { output: pipOut } = await ssh.writeAndWait(
      ctx.sshSessionId,
      'pip3 install python-pptx -q 2>&1 || pip install python-pptx -q 2>&1',
      60000,
    );

    // 7. Run the script
    const { output: runOut, timedOut } = await ssh.writeAndWait(
      ctx.sshSessionId,
      `python3 ${scriptPath} ${jsonPath} ${finalOutput}`,
      30000,
    );

    if (timedOut) {
      return { summary: 'PPT 生成超时，请检查远程机器上是否安装了 python3' };
    }

    // 8. Cleanup temp files
    await ssh.writeAndWait(ctx.sshSessionId, `rm -f ${scriptPath} ${jsonPath}`);

    // 9. Verify the file was created
    const { output: lsOut } = await ssh.writeAndWait(ctx.sshSessionId, `ls -lh ${finalOutput} 2>/dev/null`);

    if (!lsOut.includes('.pptx')) {
      return { summary: `PPT 生成失败：${runOut || '未知错误'}` };
    }

    return {
      summary: `PPT 已生成：${finalOutput}\n主题：${topic}`,
      executedCommand: `python3 ${scriptPath} ${jsonPath} ${finalOutput}`,
      output: runOut,
    };
  },
};
