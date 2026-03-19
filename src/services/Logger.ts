import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;
  private static level: LogLevel = LogLevel.INFO;

  static initialize(level: LogLevel = LogLevel.INFO): void {
    this.outputChannel?.dispose();
    this.outputChannel = vscode.window.createOutputChannel('Branch Tabs');
    this.level = level;
  }

  static debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, ...args);
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, ...args);
    }
  }

  static error(message: string, error?: any): void {
    this.log('ERROR', message, error);
    if (error?.stack) {
      this.outputChannel?.appendLine(error.stack);
    }
  }

  private static log(level: string, message: string, ...args: any[]): void {
    this.ensureOutputChannel();

    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    this.outputChannel?.appendLine(`[${timestamp}] [${level}] ${message}${formattedArgs}`);
  }

  static show(): void {
    this.ensureOutputChannel();
    this.outputChannel?.show();
  }

  static dispose(): void {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }

  private static ensureOutputChannel(): void {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Branch Tabs');
    }
  }
}
