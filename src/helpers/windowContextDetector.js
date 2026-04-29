const { execSync } = require('child_process');

/**
 * WindowContextDetector - Detects active window and determines app context
 * for context-aware tone adjustment in VoiceInk
 */
class WindowContextDetector {
  constructor() {
    this.lastContext = 'default';
    this.contextRules = {
      // Code editors - preserve technical terms, code syntax
      code: {
        keywords: ['vscode', 'cursor', 'atom', 'sublime', 'intellij', 'pycharm', 'webstorm', 'vim', 'emacs'],
        tone: 'technical',
        prompt: `You are processing text dictated into a CODE EDITOR. Follow these rules:
1. PRESERVE all technical terms, variable names, function names, API names exactly as spoken
2. Keep code snippets, commands, and technical syntax intact
3. Use proper technical punctuation (arrows =>, operators ==, etc.)
4. Format as clean text that can be pasted into code comments or documentation
5. Do NOT convert technical terms to layman terms`
      },
      
      // Email clients - professional format
      email: {
        keywords: ['gmail', 'outlook', 'mail', 'thunderbird', 'spark', 'superhuman'],
        tone: 'professional',
        prompt: `You are processing text dictated into an EMAIL CLIENT. Follow these rules:
1. Format as a proper email with appropriate greeting and closing if needed
2. Use professional tone and proper business language
3. Structure into clear paragraphs
4. Fix email addresses, phone numbers, dates to proper format
5. Add appropriate subject line if missing and context suggests it`
      },
      
      // Messaging apps - casual, conversational
      messaging: {
        keywords: ['whatsapp', 'telegram', 'signal', 'messenger', 'discord', 'slack', 'teams', 'irc'],
        tone: 'casual',
        prompt: `You are processing text dictated into a MESSAGING APP. Follow these rules:
1. Keep tone casual and conversational
2. Preserve slang, emojis mentioned, and informal expressions
3. Use natural speech patterns - don't over-formalize
4. Keep it brief and to the point like a chat message
5. Add appropriate punctuation for readability but maintain casual feel`
      },
      
      // Note-taking apps - clean markdown
      notes: {
        keywords: ['notion', 'obsidian', 'evernote', 'onenote', 'roam', 'logseq', 'bear', 'ulysses'],
        tone: 'structured',
        prompt: `You are processing text dictated into a NOTE-TAKING APP. Follow these rules:
1. Format using clean Markdown syntax
2. Create proper headings, bullet points, and numbered lists
3. Use **bold**, *italic*, and other markdown formatting appropriately
4. Structure content logically with clear hierarchy
5. Preserve links and references in markdown format`
      },
      
      // Document editors - formal, structured
      documents: {
        keywords: ['word', 'docs', 'pages', 'libreoffice', 'openoffice', 'google docs'],
        tone: 'formal',
        prompt: `You are processing text dictated into a DOCUMENT EDITOR. Follow these rules:
1. Use formal, well-structured language
2. Create proper paragraphs with topic sentences
3. Use professional vocabulary and grammar
4. Format as a coherent document section
5. Add appropriate headings and subheadings if content suggests it`
      }
    };
  }

  /**
   * Get the active window title using platform-specific commands
   */
  getActiveWindowTitle() {
    try {
      if (process.platform === 'darwin') {
        // macOS: Use AppleScript to get frontmost app and window title
        const script = `
          tell application "System Events"
            set frontApp to name of first application process whose frontmost is true
            set windowTitle to ""
            try
              tell process frontApp
                set windowTitle to name of front window
              end tell
            end try
            return frontApp & " - " & windowTitle
          end tell
        `;
        const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8', timeout: 2000 });
        return result.trim();
      } else if (process.platform === 'win32') {
        // Windows: Use PowerShell to get active window title
        const psScript = 'Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Where-Object {$_.MainWindowTitle -like "*"} | Select-Object -First 1 MainWindowTitle | Format-List | Out-String';
        const result = execSync(`powershell -Command "${psScript}"`, { encoding: 'utf8', timeout: 2000 });
        return result.trim();
      } else {
        // Linux: Try xdotool or wmctrl
        try {
          const result = execSync('xdotool getwindowfocus getwindowname', { encoding: 'utf8', timeout: 2000 });
          return result.trim();
        } catch (e) {
          const result = execSync('wmctrl -lp | grep $(xprop -root _NET_ACTIVE_WINDOW | cut -d " " -f 5) | cut -d " " -f 4-', { encoding: 'utf8', timeout: 2000 });
          return result.trim();
        }
      }
    } catch (error) {
      console.error('Failed to get active window title:', error.message);
      return '';
    }
  }

  /**
   * Determine the context based on window title
   */
  detectContext(windowTitle) {
    if (!windowTitle) return 'default';
    
    const titleLower = windowTitle.toLowerCase();
    
    for (const [contextName, rules] of Object.entries(this.contextRules)) {
      const matched = rules.keywords.some(keyword => titleLower.includes(keyword));
      if (matched) {
        return contextName;
      }
    }
    
    return 'default';
  }

  /**
   * Get the appropriate prompt addition for the detected context
   */
  getContextPrompt(windowTitle) {
    const context = this.detectContext(windowTitle);
    this.lastContext = context;
    
    if (context === 'default' || !this.contextRules[context]) {
      return '';
    }
    
    return this.contextRules[context].prompt;
  }

  /**
   * Get current context info
   */
  getCurrentContext() {
    const windowTitle = this.getActiveWindowTitle();
    const context = this.detectContext(windowTitle);
    return {
      windowTitle,
      context,
      tone: this.contextRules[context]?.tone || 'default'
    };
  }
}

module.exports = WindowContextDetector;
