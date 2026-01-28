/**
 * ANSI Escape Sequence Parser
 * Parses ANSI color codes and formatting
 */

export interface ANSISegment {
  text: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// ANSI color codes
const ANSI_COLORS: { [key: string]: string } = {
  '30': '#000000', // Black
  '31': '#FF0000', // Red
  '32': '#00FF00', // Green
  '33': '#FFFF00', // Yellow
  '34': '#0000FF', // Blue
  '35': '#FF00FF', // Magenta
  '36': '#00FFFF', // Cyan
  '37': '#FFFFFF', // White
  '90': '#808080', // Bright Black (Gray)
  '91': '#FF8080', // Bright Red
  '92': '#80FF80', // Bright Green
  '93': '#FFFF80', // Bright Yellow
  '94': '#8080FF', // Bright Blue
  '95': '#FF80FF', // Bright Magenta
  '96': '#80FFFF', // Bright Cyan
  '97': '#FFFFFF', // Bright White
};

const ANSI_BG_COLORS: { [key: string]: string } = {
  '40': '#000000', // Black
  '41': '#FF0000', // Red
  '42': '#00FF00', // Green
  '43': '#FFFF00', // Yellow
  '44': '#0000FF', // Blue
  '45': '#FF00FF', // Magenta
  '46': '#00FFFF', // Cyan
  '47': '#FFFFFF', // White
  '100': '#808080', // Bright Black (Gray)
  '101': '#FF8080', // Bright Red
  '102': '#80FF80', // Bright Green
  '103': '#FFFF80', // Bright Yellow
  '104': '#8080FF', // Bright Blue
  '105': '#FF80FF', // Bright Magenta
  '106': '#80FFFF', // Bright Cyan
  '107': '#FFFFFF', // Bright White
};

export class ANSIParser {
  /**
   * Parse ANSI escape sequences and return styled segments
   */
  parse(text: string): ANSISegment[] {
    const segments: ANSISegment[] = [];
    let currentSegment: ANSISegment = { text: '' };
    
    // ANSI escape sequence regex: \x1b[...m
    const ansiRegex = /\x1b\[([0-9;]+)m/g;
    let lastIndex = 0;
    let match;
    
    while ((match = ansiRegex.exec(text)) !== null) {
      // Add text before the escape sequence
      if (match.index > lastIndex) {
        currentSegment.text += text.substring(lastIndex, match.index);
      }
      
      // Parse the escape sequence
      const codes = match[1].split(';');
      const newSegment = this.applyANSICodes(codes, currentSegment);
      
      // If style changed, save current segment and start new one
      if (this.hasStyleChanged(currentSegment, newSegment)) {
        if (currentSegment.text) {
          segments.push(currentSegment);
        }
        currentSegment = { ...newSegment, text: '' };
      }
      
      lastIndex = ansiRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      currentSegment.text += text.substring(lastIndex);
    }
    
    if (currentSegment.text) {
      segments.push(currentSegment);
    }
    
    return segments;
  }
  
  /**
   * Apply ANSI codes to create new segment style
   */
  private applyANSICodes(
    codes: string[],
    currentSegment: ANSISegment
  ): ANSISegment {
    const newSegment: ANSISegment = { ...currentSegment };
    
    for (const code of codes) {
      switch (code) {
        case '0': // Reset
          return { text: '' };
        case '1': // Bold
          newSegment.bold = true;
          break;
        case '3': // Italic
          newSegment.italic = true;
          break;
        case '4': // Underline
          newSegment.underline = true;
          break;
        case '22': // Normal intensity
          newSegment.bold = false;
          break;
        case '23': // Not italic
          newSegment.italic = false;
          break;
        case '24': // Not underlined
          newSegment.underline = false;
          break;
        default:
          // Foreground colors
          if (ANSI_COLORS[code]) {
            newSegment.color = ANSI_COLORS[code];
          }
          // Background colors
          if (ANSI_BG_COLORS[code]) {
            newSegment.backgroundColor = ANSI_BG_COLORS[code];
          }
      }
    }
    
    return newSegment;
  }
  
  /**
   * Check if style has changed between segments
   */
  private hasStyleChanged(
    segment1: ANSISegment,
    segment2: ANSISegment
  ): boolean {
    return (
      segment1.color !== segment2.color ||
      segment1.backgroundColor !== segment2.backgroundColor ||
      segment1.bold !== segment2.bold ||
      segment1.italic !== segment2.italic ||
      segment1.underline !== segment2.underline
    );
  }
  
  /**
   * Strip ANSI escape sequences from text
   */
  strip(text: string): string {
    return text.replace(/\x1b\[[0-9;]+m/g, '');
  }
}

// Singleton instance
let ansiParserInstance: ANSIParser | null = null;

/**
 * Get ANSI parser singleton instance
 */
export function getANSIParser(): ANSIParser {
  if (!ansiParserInstance) {
    ansiParserInstance = new ANSIParser();
  }
  return ansiParserInstance;
}
