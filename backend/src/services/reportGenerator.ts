import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import {
  SpeakingTimeAnalysis,
  BiasDetection,
  ReportConfiguration,
  GeneratedReport,
  ApiResponse
} from '@/types';

export class ReportGenerator {
  private browser: Browser | null = null;
  private reportsDir: string;
  private templatesDir: string;

  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.templatesDir = path.join(process.cwd(), 'src', 'templates');
    this.ensureDirectories();
    this.registerHandlebarsHelpers();
  }

  /**
   * Ensure report directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create report directories:', error);
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('add', (a: number, b: number) => a + b);
    handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    handlebars.registerHelper('round', (num: number, decimals: number = 2) => 
      Number(num).toFixed(decimals)
    );
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Close browser connection
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateSessionReport(
    sessionId: string,
    reportConfig: ReportConfiguration
  ): Promise<GeneratedReport> {
    const startTime = Date.now();
    logger.info(`Generating ${reportConfig.type} report for session ${sessionId}`);

    try {
      // Get session data
      const sessionData = await this.getSessionReportData(sessionId);
      
      // Generate report based on format
      let filePath: string;
      let fileSize: number;

      switch (reportConfig.format) {
        case 'pdf':
          filePath = await this.generatePDFReport(sessionData, reportConfig);
          break;
        case 'html':
          filePath = await this.generateHTMLReport(sessionData, reportConfig);
          break;
        case 'json':
          filePath = await this.generateJSONReport(sessionData, reportConfig);
          break;
        default:
          throw new Error(`Unsupported report format: ${reportConfig.format}`);
      }

      // Get file size
      const stats = await fs.stat(filePath);
      fileSize = stats.size;

      // Store report metadata in database
      const report = await this.saveReportMetadata({
        sessionId,
        reportType: reportConfig.type,
        format: reportConfig.format,
        filePath,
        fileSize,
        generationTime: Date.now() - startTime,
        parameters: reportConfig.customizations || {}
      });

      logger.info(`Report generated successfully: ${filePath} (${fileSize} bytes)`);
      return report;

    } catch (error) {
      logger.error(`Report generation failed for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all data needed for session report
   */
  private async getSessionReportData(sessionId: string): Promise<any> {
    // Get session from database
    const session = await prisma.session.findFirst({
      where: { worldCafeId: sessionId },
      include: {
        participants: true,
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        speakerDynamics: true,
        biasDetections: true,
        polarizationMetrics: true
      }
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      session,
      analysis: session.aiAnalyses[0],
      speakerDynamics: session.speakerDynamics,
      biasDetections: session.biasDetections,
      polarizationMetrics: session.polarizationMetrics,
      generatedAt: new Date().toISOString(),
      reportMetadata: {
        platform: 'Eyes Café',
        version: '1.0.0',
        analysisEngine: 'Phase 2'
      }
    };
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(
    data: any,
    config: ReportConfiguration
  ): Promise<string> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Generate HTML content
      const htmlContent = await this.renderReportTemplate(data, config);
      
      // Set page content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const fileName = `${data.session.worldCafeId}_${config.type}_${Date.now()}.pdf`;
      const filePath = path.join(this.reportsDir, fileName);
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1in',
          right: '0.8in',
          bottom: '1in',
          left: '0.8in'
        }
      });

      return filePath;

    } finally {
      await page.close();
    }
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(
    data: any,
    config: ReportConfiguration
  ): Promise<string> {
    const htmlContent = await this.renderReportTemplate(data, config);
    
    const fileName = `${data.session.worldCafeId}_${config.type}_${Date.now()}.html`;
    const filePath = path.join(this.reportsDir, fileName);
    
    await fs.writeFile(filePath, htmlContent);
    return filePath;
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(
    data: any,
    config: ReportConfiguration
  ): Promise<string> {
    const fileName = `${data.session.worldCafeId}_${config.type}_${Date.now()}.json`;
    const filePath = path.join(this.reportsDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  /**
   * Render report template with data
   */
  private async renderReportTemplate(
    data: any,
    config: ReportConfiguration
  ): Promise<string> {
    // Use built-in template for now (in production, load from files)
    const template = this.getBuiltInTemplate(config.type);
    const compiledTemplate = handlebars.compile(template);
    
    // Prepare template data
    const templateData = {
      ...data,
      config,
      charts: this.generateChartData(data),
      insights: this.generateInsights(data),
      recommendations: this.generateRecommendations(data)
    };

    return compiledTemplate(templateData);
  }

  /**
   * Generate chart data for visualization
   */
  private generateChartData(data: any): any {
    const speakingData = data.speakerDynamics.map((speaker: any, index: number) => ({
      name: `Speaker ${speaker.speakerIndex}`,
      speakingTime: Math.round(speaker.speakingTimeSeconds),
      percentage: Math.round((speaker.speakingTimeSeconds / data.speakerDynamics.reduce((sum: number, s: any) => sum + s.speakingTimeSeconds, 0)) * 100),
      turnsCount: speaker.turnCount,
      wordsPerMinute: Math.round(speaker.wordsPerMinute || 0),
      dominanceIndex: Math.round(speaker.dominanceIndex * 100) / 100,
      engagementLevel: speaker.engagementLevel
    }));

    return {
      speakingDistribution: speakingData,
      biasesSeverity: this.getBiasChartData(data.biasDetections),
      engagementLevels: this.getEngagementChartData(speakingData)
    };
  }

  /**
   * Generate bias chart data
   */
  private getBiasChartData(biases: any[]): any {
    const severityCount = { low: 0, medium: 0, high: 0 };
    biases.forEach(bias => {
      if (bias.severityScore < 0.3) severityCount.low++;
      else if (bias.severityScore < 0.7) severityCount.medium++;
      else severityCount.high++;
    });
    return severityCount;
  }

  /**
   * Generate engagement chart data
   */
  private getEngagementChartData(speakingData: any[]): any {
    const engagementCount = { low: 0, medium: 0, high: 0 };
    speakingData.forEach(speaker => {
      engagementCount[speaker.engagementLevel]++;
    });
    return engagementCount;
  }

  /**
   * Generate insights from analysis data
   */
  private generateInsights(data: any): string[] {
    const insights = [];
    const speakers = data.speakerDynamics;
    const biases = data.biasDetections;

    // Speaking time insights
    if (speakers.length > 0) {
      const avgSpeakingTime = speakers.reduce((sum: number, s: any) => sum + s.speakingTimeSeconds, 0) / speakers.length;
      const dominantSpeaker = speakers.reduce((prev: any, current: any) => 
        current.speakingTimeSeconds > prev.speakingTimeSeconds ? current : prev
      );
      
      if (dominantSpeaker.speakingTimeSeconds > avgSpeakingTime * 2) {
        insights.push(`Speaker ${dominantSpeaker.speakerIndex} dominates conversation with ${Math.round(dominantSpeaker.speakingTimeSeconds)} seconds (${Math.round((dominantSpeaker.speakingTimeSeconds / speakers.reduce((sum: number, s: any) => sum + s.speakingTimeSeconds, 0)) * 100)}% of total time)`);
      }
    }

    // Bias insights
    if (biases.length > 0) {
      const highSeverityBiases = biases.filter((b: any) => b.severityScore > 0.7);
      if (highSeverityBiases.length > 0) {
        insights.push(`${highSeverityBiases.length} high-severity bias pattern(s) detected that may significantly impact group dynamics`);
      }
    }

    // Engagement insights
    const lowEngagement = speakers.filter((s: any) => s.engagementLevel === 'low');
    if (lowEngagement.length > speakers.length * 0.3) {
      insights.push(`${lowEngagement.length} participants show low engagement levels, suggesting potential barriers to participation`);
    }

    return insights;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(data: any): string[] {
    const recommendations = [];
    const biases = data.biasDetections;
    const speakers = data.speakerDynamics;

    // Bias-based recommendations
    biases.forEach((bias: any) => {
      if (bias.biasType === 'language' && bias.biasCategory === 'dismissal') {
        recommendations.push("Establish ground rules for respectful dialogue and encourage 'yes, and...' responses");
      }
      if (bias.biasType === 'participation' && bias.biasCategory === 'interruption') {
        recommendations.push("Implement structured turn-taking or use a talking stick to prevent interruptions");
      }
    });

    // Speaking balance recommendations
    const avgSpeakingTime = speakers.reduce((sum: number, s: any) => sum + s.speakingTimeSeconds, 0) / speakers.length;
    const imbalance = speakers.some((s: any) => s.speakingTimeSeconds > avgSpeakingTime * 2.5);
    
    if (imbalance) {
      recommendations.push("Use time-boxing or round-robin formats to ensure more balanced participation");
    }

    // Engagement recommendations
    const lowEngagement = speakers.filter((s: any) => s.engagementLevel === 'low').length;
    if (lowEngagement > 0) {
      recommendations.push("Consider smaller breakout groups to encourage participation from quieter members");
    }

    return recommendations;
  }

  /**
   * Get built-in HTML template
   */
  private getBuiltInTemplate(reportType: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Eyes Café - {{session.title}} Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #333; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #1e40af; margin: 0; }
        .subtitle { font-size: 16px; color: #6b7280; margin-top: 5px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section-title { font-size: 20px; font-weight: bold; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .metric-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; }
        .metric-title { font-weight: bold; color: #1e40af; }
        .metric-value { font-size: 18px; font-weight: bold; color: #059669; }
        .bias-alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; }
        .bias-high { border-left-color: #dc2626; }
        .bias-medium { border-left-color: #f59e0b; }
        .bias-low { border-left-color: #10b981; }
        .speaker-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .insight { background: #eff6ff; padding: 12px; margin: 8px 0; border-radius: 6px; }
        .recommendation { background: #f0fdf4; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #22c55e; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        .charts { display: flex; flex-wrap: wrap; gap: 20px; }
        .chart { flex: 1; min-width: 300px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Eyes Café Analysis Report</h1>
        <p class="subtitle">{{session.title}} - {{reportMetadata.platform}} {{reportMetadata.version}}</p>
        <p class="subtitle">Generated on {{generatedAt}}</p>
    </div>

    <div class="section">
        <h2 class="section-title">Session Overview</h2>
        <div class="metric-card">
            <div class="metric-title">Session Status</div>
            <div class="metric-value">{{session.status}}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Tables</div>
            <div class="metric-value">{{session.tableCount}}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Participants Analyzed</div>
            <div class="metric-value">{{speakerDynamics.length}}</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Speaking Time Analysis</h2>
        {{#each charts.speakingDistribution}}
        <div class="speaker-row">
            <span><strong>{{name}}</strong></span>
            <span>{{speakingTime}}s ({{percentage}}%)</span>
            <span>{{turnsCount}} turns</span>
            <span>{{wordsPerMinute}} wpm</span>
            <span>{{engagementLevel}} engagement</span>
        </div>
        {{/each}}
    </div>

    {{#if biasDetections.length}}
    <div class="section">
        <h2 class="section-title">Bias Detection Results</h2>
        <p><strong>{{biasDetections.length}}</strong> potential bias pattern(s) detected</p>
        {{#each biasDetections}}
        <div class="bias-alert bias-{{#if (gt severityScore 0.7)}}high{{else}}{{#if (gt severityScore 0.3)}}medium{{else}}low{{/if}}{{/if}}">
            <div><strong>{{biasType}} bias - {{biasCategory}}</strong></div>
            <div>Severity: {{severityScore}} | Confidence: {{confidenceLevel}}</div>
            <div>{{contextText}}</div>
            {{#if evidenceText}}
            <div><em>Evidence: {{evidenceText}}</em></div>
            {{/if}}
        </div>
        {{/each}}
    </div>
    {{/if}}

    {{#if insights.length}}
    <div class="section">
        <h2 class="section-title">Key Insights</h2>
        {{#each insights}}
        <div class="insight">{{this}}</div>
        {{/each}}
    </div>
    {{/if}}

    {{#if recommendations.length}}
    <div class="section">
        <h2 class="section-title">Recommendations</h2>
        {{#each recommendations}}
        <div class="recommendation">{{this}}</div>
        {{/each}}
    </div>
    {{/if}}

    <div class="footer">
        <p>Generated by Eyes Café Conversation Intelligence Platform | Processing Time: {{analysis.processingTimeMs}}ms</p>
        <p>This report provides automated analysis of conversation patterns and should be interpreted by qualified facilitators.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Save report metadata to database
   */
  private async saveReportMetadata(reportData: {
    sessionId: string;
    reportType: string;
    format: string;
    filePath: string;
    fileSize: number;
    generationTime: number;
    parameters: any;
  }): Promise<GeneratedReport> {
    const session = await prisma.session.findFirst({
      where: { worldCafeId: reportData.sessionId }
    });

    if (!session) {
      throw new Error(`Session ${reportData.sessionId} not found`);
    }

    const report = await prisma.generatedReport.create({
      data: {
        sessionId: session.id,
        reportType: reportData.reportType,
        format: reportData.format,
        filePath: reportData.filePath,
        fileSizeBytes: reportData.fileSize,
        generationTimeMs: reportData.generationTime,
        parameters: reportData.parameters,
        generatedBy: 'system',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    return {
      id: report.id,
      sessionId: reportData.sessionId,
      reportType: report.reportType,
      format: report.format,
      filePath: report.filePath,
      fileSize: report.fileSizeBytes,
      generatedAt: report.generatedAt.toISOString(),
      expiresAt: report.expiresAt?.toISOString(),
      downloadCount: report.downloadCount
    };
  }

  /**
   * Get existing reports for a session
   */
  async getSessionReports(sessionId: string): Promise<GeneratedReport[]> {
    const session = await prisma.session.findFirst({
      where: { worldCafeId: sessionId }
    });

    if (!session) {
      return [];
    }

    const reports = await prisma.generatedReport.findMany({
      where: { sessionId: session.id },
      orderBy: { generatedAt: 'desc' }
    });

    return reports.map(report => ({
      id: report.id,
      sessionId: sessionId,
      reportType: report.reportType,
      format: report.format,
      filePath: report.filePath,
      fileSize: report.fileSizeBytes,
      generatedAt: report.generatedAt.toISOString(),
      expiresAt: report.expiresAt?.toISOString(),
      downloadCount: report.downloadCount
    }));
  }

  /**
   * Get report file for download
   */
  async getReportFile(reportId: string): Promise<{
    buffer: Buffer;
    filename: string;
    contentType: string;
  }> {
    const report = await prisma.generatedReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (!report.filePath) {
      throw new Error(`Report ${reportId} file path not found`);
    }

    // Check if file exists
    try {
      await fs.access(report.filePath);
    } catch {
      throw new Error(`Report file ${report.filePath} not found on disk`);
    }

    // Read file
    const buffer = await fs.readFile(report.filePath);
    
    // Increment download count
    await prisma.generatedReport.update({
      where: { id: reportId },
      data: { downloadCount: { increment: 1 } }
    });

    // Generate filename and content type
    const filename = `eyes-cafe-report-${reportId}.${report.format}`;
    const contentType = report.format === 'pdf' ? 'application/pdf' : 
                       report.format === 'html' ? 'text/html' : 
                       'application/json';

    return {
      buffer,
      filename,
      contentType
    };
  }
}