
export const getModelIcon = (modelName: string): string => {
  const modelIcons: { [key: string]: string } = {
    'anthropic/claude-opus-4-20250514': '🧠',
    'anthropic/claude-sonnet-4-20250514': '⚡',
    'anthropic/claude-3-5-haiku-20241022': '🌟',
    'anthropic/claude-3-7-sonnet-20250219': '🔮',
    'anthropic/claude-3-5-sonnet-20241022': '💫',
    'anthropic/claude-3-opus-20240229': '🎯',
    'anthropic/claude-sonnet-4': '⚡',
    'gpt-4': '🤖',
    'gpt-3.5-turbo': '💬',
    'default': '🤖'
  };

  return modelIcons[modelName] || modelIcons['default'];
};

export const getModelDisplayName = (modelName: string): string => {
  const modelNames: { [key: string]: string } = {
    'anthropic/claude-opus-4-20250514': 'Claude Opus 4',
    'anthropic/claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'anthropic/claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
    'anthropic/claude-3-7-sonnet-20250219': 'Claude Sonnet 3.7',
    'anthropic/claude-3-5-sonnet-20241022': 'Claude Sonnet 3.5',
    'anthropic/claude-3-opus-20240229': 'Claude Opus 3',
    'anthropic/claude-sonnet-4': 'Claude Sonnet 4',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo'
  };

  return modelNames[modelName] || modelName;
};
