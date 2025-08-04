/**
 * Deployment Debug Utility
 * Diagnoses authentication and environment issues across different deployment URLs
 */

import { supabase } from '@/lib/supabase';

interface DebugInfo {
  timestamp: string;
  url: string;
  environment: {
    supabaseUrl?: string;
    supabaseKeyPrefix?: string;
    stripeKeyPrefix?: string;
    appUrl?: string;
    nodeEnv?: string;
    viteMode?: string;
  };
  supabase: {
    connected: boolean;
    error?: string;
    session?: {
      hasSession: boolean;
      userId?: string;
      email?: string;
      isExpired?: boolean;
    };
  };
  browser: {
    userAgent: string;
    cookiesEnabled: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  };
  network: {
    online: boolean;
    connection?: any;
  };
  deployment: {
    isVercel: boolean;
    isPreview: boolean;
    deploymentId?: string;
    branch?: string;
    commitSha?: string;
  };
}

class DeploymentDebugger {
  private debugInfo: DebugInfo;

  constructor() {
    this.debugInfo = this.initializeDebugInfo();
  }

  private initializeDebugInfo(): DebugInfo {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      environment: this.getEnvironmentInfo(),
      supabase: {
        connected: false,
      },
      browser: this.getBrowserInfo(),
      network: this.getNetworkInfo(),
      deployment: this.getDeploymentInfo(),
    };
  }

  private getEnvironmentInfo() {
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKeyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      stripeKeyPrefix: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...',
      appUrl: import.meta.env.VITE_APP_URL,
      nodeEnv: import.meta.env.NODE_ENV,
      viteMode: import.meta.env.MODE,
    };
  }

  private getBrowserInfo() {
    const testCookies = () => {
      try {
        document.cookie = 'test=1';
        const result = document.cookie.indexOf('test=1') !== -1;
        document.cookie = 'test=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
        return result;
      } catch {
        return false;
      }
    };

    const testStorage = (type: 'localStorage' | 'sessionStorage') => {
      try {
        const storage = window[type];
        const test = '__storage_test__';
        storage.setItem(test, test);
        storage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    };

    return {
      userAgent: navigator.userAgent,
      cookiesEnabled: testCookies(),
      localStorage: testStorage('localStorage'),
      sessionStorage: testStorage('sessionStorage'),
    };
  }

  private getNetworkInfo() {
    return {
      online: navigator.onLine,
      connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
    };
  }

  private getDeploymentInfo() {
    const hostname = window.location.hostname;
    const isVercel = hostname.includes('vercel.app');
    const isPreview = isVercel && hostname.includes('-');
    
    let deploymentId, branch, commitSha;
    
    if (isVercel && isPreview) {
      // Extract deployment info from Vercel preview URL
      // Format: https://project-name-git-branch-team.vercel.app
      // or: https://project-name-commit-team.vercel.app
      const parts = hostname.split('.');
      if (parts[0]) {
        const urlParts = parts[0].split('-');
        if (urlParts.length >= 3) {
          deploymentId = urlParts[urlParts.length - 1]; // team name or deployment hash
          
          // Try to identify branch vs commit
          const gitIndex = urlParts.indexOf('git');
          if (gitIndex !== -1 && gitIndex < urlParts.length - 2) {
            branch = urlParts[gitIndex + 1];
          } else {
            // Might be a commit hash
            commitSha = urlParts[urlParts.length - 2];
          }
        }
      }
    }

    return {
      isVercel,
      isPreview,
      deploymentId,
      branch,
      commitSha,
    };
  }

  async runSupabaseTests(): Promise<void> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test basic connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        this.debugInfo.supabase = {
          connected: false,
          error: sessionError.message,
        };
        console.error('❌ Supabase session error:', sessionError);
        return;
      }

      this.debugInfo.supabase.connected = true;
      
      if (sessionData.session) {
        const isExpired = sessionData.session.expires_at ? 
          new Date(sessionData.session.expires_at * 1000) < new Date() : false;
        
        this.debugInfo.supabase.session = {
          hasSession: true,
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email,
          isExpired,
        };
        
        console.log('✅ Active session found:', {
          email: sessionData.session.user.email,
          expires: new Date(sessionData.session.expires_at! * 1000).toISOString(),
          isExpired,
        });

        // Test admin status if authenticated
        await this.testAdminAccess(sessionData.session.user.id);
      } else {
        this.debugInfo.supabase.session = { hasSession: false };
        console.log('ℹ️ No active session');
      }

      // Test basic database connectivity
      await this.testDatabaseAccess();
      
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      this.debugInfo.supabase = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testAdminAccess(userId: string): Promise<void> {
    try {
      console.log('🔍 Testing admin access...');
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Admin access test failed:', error);
        return;
      }

      if (data) {
        console.log('✅ Admin user found:', data);
      } else {
        console.log('ℹ️ User is not an admin');
      }
    } catch (error) {
      console.error('❌ Admin access test error:', error);
    }
  }

  private async testDatabaseAccess(): Promise<void> {
    try {
      console.log('🔍 Testing database access...');
      
      // Test public table access (should work without auth)
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Database access failed:', error);
      } else {
        console.log('✅ Database accessible, found', data?.length || 0, 'products');
      }
    } catch (error) {
      console.error('❌ Database test error:', error);
    }
  }

  printDebugReport(): void {
    console.group('🐛 DEPLOYMENT DEBUG REPORT');
    console.log('Generated at:', this.debugInfo.timestamp);
    console.log('URL:', this.debugInfo.url);
    
    console.group('🌍 Environment');
    console.table(this.debugInfo.environment);
    console.groupEnd();
    
    console.group('🔗 Supabase');
    console.log('Connected:', this.debugInfo.supabase.connected);
    if (this.debugInfo.supabase.error) {
      console.error('Error:', this.debugInfo.supabase.error);
    }
    if (this.debugInfo.supabase.session) {
      console.table(this.debugInfo.supabase.session);
    }
    console.groupEnd();
    
    console.group('🌐 Browser');
    console.table(this.debugInfo.browser);
    console.groupEnd();
    
    console.group('📡 Network');
    console.table(this.debugInfo.network);
    console.groupEnd();
    
    console.group('🚀 Deployment');
    console.table(this.debugInfo.deployment);
    console.groupEnd();
    
    // Recommendations
    console.group('💡 Recommendations');
    this.generateRecommendations();
    console.groupEnd();
    
    console.groupEnd();
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];
    
    if (!this.debugInfo.supabase.connected) {
      recommendations.push('❌ Fix Supabase connection - check environment variables');
    }
    
    if (!this.debugInfo.browser.cookiesEnabled) {
      recommendations.push('❌ Enable cookies - required for authentication');
    }
    
    if (!this.debugInfo.browser.localStorage) {
      recommendations.push('❌ Enable localStorage - required for session persistence');
    }
    
    if (!this.debugInfo.network.online) {
      recommendations.push('❌ Check internet connection');
    }
    
    if (this.debugInfo.deployment.isVercel && !this.debugInfo.deployment.isPreview) {
      recommendations.push('💡 Try using a deployment preview URL if main URL has issues');
    }
    
    if (this.debugInfo.supabase.session?.isExpired) {
      recommendations.push('🔄 Session expired - refresh the page to re-authenticate');
    }
    
    const supabaseUrl = this.debugInfo.environment.supabaseUrl;
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      recommendations.push('❌ Supabase URL should start with https://');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ No issues detected - environment looks healthy');
    }
    
    recommendations.forEach(rec => console.log(rec));
  }

  getDebugData(): DebugInfo {
    return { ...this.debugInfo };
  }

  async exportDebugReport(): Promise<string> {
    await this.runSupabaseTests();
    
    const report = {
      ...this.debugInfo,
      _meta: {
        reportVersion: '1.0',
        generatedBy: 'KCT Menswear Debug Tool',
      },
    };
    
    return JSON.stringify(report, null, 2);
  }
}

// Main debug function
export async function debugDeployment(): Promise<void> {
  const deploymentDebugger = new DeploymentDebugger();
  
  console.log('🔍 Starting deployment diagnostics...');
  
  await deploymentDebugger.runSupabaseTests();
  deploymentDebugger.printDebugReport();
  
  // Also log the raw data for copying
  console.log('📋 Raw debug data (copy for support):');
  console.log(await deploymentDebugger.exportDebugReport());
}

// Auto-run in development or when explicitly enabled
export function autoDebugIfNeeded(): void {
  const shouldAutoDebug = 
    import.meta.env.DEV || 
    localStorage.getItem('debug-deployment') === 'true' ||
    window.location.search.includes('debug=true');
  
  if (shouldAutoDebug) {
    // Run after a short delay to avoid blocking app initialization
    setTimeout(() => {
      debugDeployment().catch(console.error);
    }, 2000);
  }
}

// Enable/disable auto-debugging
export function enableAutoDebug(): void {
  localStorage.setItem('debug-deployment', 'true');
  console.log('🔍 Auto-debugging enabled. Refresh to see diagnostics.');
}

export function disableAutoDebug(): void {
  localStorage.removeItem('debug-deployment');
  console.log('🔍 Auto-debugging disabled.');
}

// Expose to global scope for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugDeployment = debugDeployment;
  (window as any).enableAutoDebug = enableAutoDebug;
  (window as any).disableAutoDebug = disableAutoDebug;
}

export default DeploymentDebugger;