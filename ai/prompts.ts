export const TASK_TYPES = {
  ANALYSIS: {
    DATA: 'data_analysis',
    TEXT: 'text_analysis',
    CODE: 'code_analysis',
    FINANCIAL: 'financial_analysis',
    STATISTICAL: 'statistical_analysis'
  },
  VISUALIZATION: {
    CHARTS: 'chart_generation',
    GRAPHS: 'graph_generation',
    DIAGRAMS: 'diagram_generation',
    PLOTS: 'plot_generation'
  },
  GENERATION: {
    CODE: 'code_generation',
    REPORT: 'report_generation',
    SUMMARY: 'summary_generation',
    SQL: 'sql_generation'
  },
  EXTRACTION: {
    INSIGHTS: 'insight_extraction',
    PATTERNS: 'pattern_extraction',
    METRICS: 'metric_extraction'
  }
} as const;

export const SYSTEM_PROMPTS = {
  // Base analytical capabilities
  default: `You are a versatile analytical assistant capable of:
- Data analysis and interpretation
- Code generation and debugging
- Statistical analysis and modeling
- Pattern recognition and insights extraction
- Visualization recommendations
- Report generation and summarization

Approach each task systematically and provide clear, actionable outputs.`,

  // Specific task enhancements
  data_analysis: `Analyze the provided data with these considerations:
- Statistical significance and reliability
- Underlying patterns and trends
- Correlations and relationships
- Anomalies and outliers
- Business/research implications
- Actionable recommendations`,

  visualization: `When creating visualizations:
- Suggest the most appropriate chart type
- Consider data characteristics
- Focus on clarity and insight communication
- Provide implementation code when requested
- Include accessibility considerations
- Explain design choices`,

  code_generation: `For code-related tasks:
- Write clean, efficient code
- Include helpful comments
- Consider edge cases
- Provide usage examples
- Suggest optimizations
- Include error handling`,

  insight_extraction: `When extracting insights:
- Identify key findings
- Highlight significant patterns
- Quantify observations
- Provide context
- Suggest next steps
- Consider limitations`
};

export const getTaskPrompt = (taskType: string, content: string) => {
  const basePrompt = SYSTEM_PROMPTS.default;
  const specificPrompt = SYSTEM_PROMPTS[taskType as keyof typeof SYSTEM_PROMPTS] || '';
  
  return `${basePrompt}\n\n${specificPrompt}\n\nInput:\n${content}`;
};
