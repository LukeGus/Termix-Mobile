import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  SSHHost,
  SSHHostData,
  TunnelConfig,
  TunnelStatus,
  Credential,
  CredentialData,
  HostInfo,
  ApiResponse,
  FileManagerFile,
  FileManagerShortcut,
} from "../types/index";
import {
  apiLogger,
  authLogger,
  sshLogger,
  tunnelLogger,
  fileLogger,
  statsLogger,
  systemLogger,
  type LogContext,
} from "../lib/frontend-logger";

import AsyncStorage from "@react-native-async-storage/async-storage";

interface FileManagerOperation {
  name: string;
  path: string;
  isSSH: boolean;
  sshSessionId?: string;
  hostId: number;
}

export type ServerStatus = {
  status: "online" | "offline";
  lastChecked: string;
};

interface CpuMetrics {
  percent: number | null;
  cores: number | null;
  load: [number, number, number] | null;
}

interface MemoryMetrics {
  percent: number | null;
  usedGiB: number | null;
  totalGiB: number | null;
}

interface DiskMetrics {
  percent: number | null;
  usedHuman: string | null;
  totalHuman: string | null;
}

export type ServerMetrics = {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  lastChecked: string;
};

interface AuthResponse {
  token?: string;
  requires_totp?: boolean;
  temp_token?: string;
}

interface UserInfo {
  totp_enabled: boolean;
  id: string;
  username: string;
  is_admin: boolean;
}

interface UserCount {
  count: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isElectron(): boolean {
  return false;
}

function getLoggerForService(serviceName: string) {
  if (serviceName.includes("SSH") || serviceName.includes("ssh")) {
    return sshLogger;
  } else if (serviceName.includes("TUNNEL") || serviceName.includes("tunnel")) {
    return tunnelLogger;
  } else if (serviceName.includes("FILE") || serviceName.includes("file")) {
    return fileLogger;
  } else if (serviceName.includes("STATS") || serviceName.includes("stats")) {
    return statsLogger;
  } else if (serviceName.includes("AUTH") || serviceName.includes("auth")) {
    return authLogger;
  } else {
    return apiLogger;
  }
}

export async function setCookie(
  name: string,
  value: string,
  days = 7,
): Promise<void> {
  try {
    await AsyncStorage.setItem(name, value);
  } catch (error) {
    console.error("Failed to save token:", error);
  }
}

export async function getCookie(name: string): Promise<string | undefined> {
  try {
    const token = await AsyncStorage.getItem(name);
    return token || undefined;
  } catch (error) {
    console.error("Failed to get token:", error);
    return undefined;
  }
}

function createApiInstance(
  baseURL: string,
  serviceName: string = "API",
): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  instance.interceptors.request.use(async (config) => {
    const startTime = performance.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    (config as any).startTime = startTime;
    (config as any).requestId = requestId;

    const token = await getCookie("jwt");
    const method = config.method?.toUpperCase() || "UNKNOWN";
    const url = config.url || "UNKNOWN";
    const fullUrl = `${config.baseURL}${url}`;

    const context: LogContext = {
      requestId,
      method,
      url: fullUrl,
      operation: "request_start",
    };

    const logger = getLoggerForService(serviceName);

    logger.requestStart(method, fullUrl, context);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      authLogger.warn(
        "No JWT token found, request will be unauthenticated",
        context,
      );
    }

    config.headers["User-Agent"] = "Termix-Mobile/1.0.0";

    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      const endTime = performance.now();
      const startTime = (response.config as any).startTime;
      const requestId = (response.config as any).requestId;
      const responseTime = Math.round(endTime - startTime);

      const method = response.config.method?.toUpperCase() || "UNKNOWN";
      const url = response.config.url || "UNKNOWN";
      const fullUrl = `${response.config.baseURL}${url}`;

      const context: LogContext = {
        requestId,
        method,
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        operation: "request_success",
      };

      const logger = getLoggerForService(serviceName);

      logger.requestSuccess(
        method,
        fullUrl,
        response.status,
        responseTime,
        context,
      );

      if (responseTime > 3000) {
        logger.warn(`🐌 Slow request: ${responseTime}ms`, context);
      }

      return response;
    },
    (error: AxiosError) => {
      const endTime = performance.now();
      const startTime = (error.config as any)?.startTime;
      const requestId = (error.config as any)?.requestId;
      const responseTime = startTime
        ? Math.round(endTime - startTime)
        : undefined;

      const method = error.config?.method?.toUpperCase() || "UNKNOWN";
      const url = error.config?.url || "UNKNOWN";
      const fullUrl = error.config?.baseURL
        ? `${error.config.baseURL}${url}`
        : url;
      const status = error.response?.status;
      const message =
        (error.response?.data as any)?.error ||
        (error as Error).message ||
        "Unknown error";
      const errorCode = (error.response?.data as any)?.code || error.code;

      const context: LogContext = {
        requestId,
        method,
        url: fullUrl,
        status,
        responseTime,
        errorCode,
        errorMessage: message,
        operation: "request_error",
      };

      const logger = getLoggerForService(serviceName);

      if (status === 401) {
        logger.authError(method, fullUrl, context);
      } else if (status === 0 || !status) {
        logger.networkError(method, fullUrl, message, context);
      } else {
        logger.requestError(
          method,
          fullUrl,
          status || 0,
          message,
          responseTime,
          context,
        );
      }

      if (status === 401) {
        AsyncStorage.removeItem("jwt").catch((error) => {
          console.error("Failed to remove token:", error);
        });
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

// ============================================================================
// API INSTANCES
// ============================================================================

let configuredServerUrl: string | null = null;

export interface ServerConfig {
  serverUrl: string;
  lastUpdated: string;
}

export async function saveServerConfig(config: ServerConfig): Promise<boolean> {
  try {
    await AsyncStorage.setItem("serverConfig", JSON.stringify(config));
    configuredServerUrl = config.serverUrl;
    updateApiInstances();
    await detectAndUpdateApiInstances();
    return true;
  } catch (error) {
    console.error("Failed to save server config:", error);
    return false;
  }
}

export async function testServerConnection(
  serverUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUrl = serverUrl.replace(/\/$/, "");
    const healthUrl = `${cleanUrl}/health`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout

    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Termix-Mobile/1.0.0",
      },
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      error: response.ok
        ? undefined
        : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    console.error("Connection test error:", error);
    return {
      success: false,
      error: error.message || "Connection test failed",
    };
  }
}

export async function initializeServerConfig(): Promise<void> {
  try {
    const configStr = await AsyncStorage.getItem("serverConfig");

    if (configStr) {
      const config = JSON.parse(configStr);

      if (config?.serverUrl) {
        configuredServerUrl = config.serverUrl;
        updateApiInstances();
        await detectAndUpdateApiInstances();
      } else {
      }
    } else {
    }
  } catch (error) {
    console.error("Failed to load server config:", error);
  }
}

export function getCurrentServerUrl(): string | null {
  return configuredServerUrl;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getCookie("jwt");
    return !!token;
  } catch (error) {
    console.error("Failed to check authentication status:", error);
    return false;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await AsyncStorage.removeItem("jwt");
  } catch (error) {
    console.error("Failed to clear auth data:", error);
  }
}

function getApiUrl(path: string, defaultPort: number): string {
  if (configuredServerUrl) {
    const baseUrl = configuredServerUrl.replace(/\/$/, "");
    const fullUrl = `${baseUrl}${path}`;
    return fullUrl;
  }
  const fallbackUrl = `http://localhost:${defaultPort}${path}`;
  return fallbackUrl;
}

function getRootBase(defaultPort: number): string {
  if (configuredServerUrl) {
    const trimmed = configuredServerUrl.replace(/\/$/, "");
    const withoutSsh = trimmed.replace(/\/(ssh)(\/$)?$/, "");
    return withoutSsh || trimmed;
  }
  return `http://localhost:${defaultPort}`;
}

function getSshBase(defaultPort: number): string {
  if (configuredServerUrl) {
    const trimmed = configuredServerUrl.replace(/\/$/, "");
    if (/\/(ssh)$/.test(trimmed)) {
      return trimmed;
    }
    return `${trimmed}/ssh`;
  }
  return `http://localhost:${defaultPort}/ssh`;
}

function initializeApiInstances() {
  sshHostApi = createApiInstance(getApiUrl("/ssh", 8081), "SSH_HOST");

  tunnelApi = createApiInstance(getApiUrl("/ssh", 8083), "TUNNEL");

  fileManagerApi = createApiInstance(
    getApiUrl("/ssh/file_manager", 8084),
    "FILE_MANAGER",
  );

  statsApi = createApiInstance(getApiUrl("/ssh", 8085), "STATS");

  authApi = createApiInstance(getApiUrl("", 8081), "AUTH");
}

async function detectAndUpdateApiInstances(): Promise<void> {
  try {
    const [statsRootOk, statsSshOk, authRootOk, authSshOk] = await Promise.all([
      (async () => {
        try {
          const base = getRootBase(8085).replace(/\/$/, "");
          const res = await fetch(`${base}/status`, { method: "HEAD" });
          return res.ok;
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          const base = getSshBase(8085).replace(/\/$/, "");
          const res = await fetch(`${base}/status`, { method: "HEAD" });
          return res.ok;
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          const base = getRootBase(8081).replace(/\/$/, "");
          const res = await fetch(`${base}/users/registration-allowed`, {
            method: "HEAD",
          });
          return res.ok;
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          const base = getSshBase(8081).replace(/\/$/, "");
          const res = await fetch(`${base}/users/registration-allowed`, {
            method: "HEAD",
          });
          return res.ok;
        } catch {
          return false;
        }
      })(),
    ]);

    if (statsRootOk) {
      statsApi = createApiInstance(getRootBase(8085), "STATS");
    } else if (statsSshOk) {
      statsApi = createApiInstance(getSshBase(8085), "STATS");
    }

    if (authRootOk) {
      authApi = createApiInstance(getRootBase(8081), "AUTH");
    } else if (authSshOk) {
      authApi = createApiInstance(getSshBase(8081), "AUTH");
    }
  } catch (e) {}
}

// SSH Host Management API (port 8081)
export let sshHostApi: AxiosInstance;

// Tunnel Management API (port 8083)
export let tunnelApi: AxiosInstance;

// File Manager Operations API (port 8084)
export let fileManagerApi: AxiosInstance;

// Server Statistics API (port 8085)
export let statsApi: AxiosInstance;

// Authentication API (port 8081)
export let authApi: AxiosInstance;

initializeApiInstances();

function updateApiInstances() {
  systemLogger.info("Updating API instances with new server configuration", {
    operation: "api_instance_update",
    configuredServerUrl,
  });

  initializeApiInstances();

  systemLogger.success("All API instances updated successfully", {
    operation: "api_instance_update_complete",
    configuredServerUrl,
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function handleApiError(error: unknown, operation: string): never {
  const context: LogContext = {
    operation: "error_handling",
    errorOperation: operation,
  };

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;
    const code = error.response?.data?.code;
    const url = error.config?.url || "UNKNOWN";
    const method = error.config?.method?.toUpperCase() || "UNKNOWN";

    const errorContext: LogContext = {
      ...context,
      method,
      url,
      status,
      errorCode: code,
      errorMessage: message,
    };

    if (status === 401) {
      authLogger.warn(
        `Auth failed: ${method} ${url} - ${message}`,
        errorContext,
      );
      throw new ApiError(
        "Authentication required. Please log in again.",
        401,
        "AUTH_REQUIRED",
      );
    } else if (status === 403) {
      authLogger.warn(`Access denied: ${method} ${url}`, errorContext);
      throw new ApiError(
        "Access denied. You do not have permission to perform this action.",
        403,
        "ACCESS_DENIED",
      );
    } else if (status === 404) {
      apiLogger.warn(`Not found: ${method} ${url}`, errorContext);
      throw new ApiError(
        "Resource not found. The requested item may have been deleted.",
        404,
        "NOT_FOUND",
      );
    } else if (status === 409) {
      apiLogger.warn(`Conflict: ${method} ${url}`, errorContext);
      throw new ApiError(
        "Conflict. The resource already exists or is in use.",
        409,
        "CONFLICT",
      );
    } else if (status === 422) {
      apiLogger.warn(
        `Validation error: ${method} ${url} - ${message}`,
        errorContext,
      );
      throw new ApiError(
        "Validation error. Please check your input and try again.",
        422,
        "VALIDATION_ERROR",
      );
    } else if (status && status >= 500) {
      apiLogger.error(
        `Server error: ${method} ${url} - ${message}`,
        error,
        errorContext,
      );
      throw new ApiError(
        "Server error occurred. Please try again later.",
        status,
        "SERVER_ERROR",
      );
    } else if (status === 0) {
      if (url.includes("no-server-configured")) {
        apiLogger.error(
          `No server configured: ${method} ${url}`,
          error,
          errorContext,
        );
        throw new ApiError(
          "No server configured. Please configure a Termix server first.",
          0,
          "NO_SERVER_CONFIGURED",
        );
      }
      apiLogger.error(
        `Network error: ${method} ${url} - ${message}`,
        error,
        errorContext,
      );
      throw new ApiError(
        "Network error. Please check your connection and try again.",
        0,
        "NETWORK_ERROR",
      );
    } else {
      apiLogger.error(
        `Request failed: ${method} ${url} - ${message}`,
        error,
        errorContext,
      );
      throw new ApiError(message || `Failed to ${operation}`, status, code);
    }
  }

  if (error instanceof ApiError) {
    throw error;
  }

  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  apiLogger.error(
    `Unexpected error during ${operation}: ${errorMessage}`,
    error,
    context,
  );
  throw new ApiError(
    `Unexpected error during ${operation}: ${errorMessage}`,
    undefined,
    "UNKNOWN_ERROR",
  );
}

// ============================================================================
// SSH HOST MANAGEMENT
// ============================================================================

export async function getSSHHosts(): Promise<SSHHost[]> {
  try {
    const response = await sshHostApi.get("/db/host");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch SSH hosts");
  }
}

export async function createSSHHost(hostData: SSHHostData): Promise<SSHHost> {
  try {
    const submitData = {
      name: hostData.name || "",
      ip: hostData.ip,
      port: parseInt(hostData.port.toString()) || 22,
      username: hostData.username,
      folder: hostData.folder || "",
      tags: hostData.tags || [],
      pin: Boolean(hostData.pin),
      authType: hostData.authType,
      password: hostData.authType === "password" ? hostData.password : null,
      key: hostData.authType === "key" ? hostData.key : null,
      keyPassword: hostData.authType === "key" ? hostData.keyPassword : null,
      keyType: hostData.authType === "key" ? hostData.keyType : null,
      credentialId:
        hostData.authType === "credential" ? hostData.credentialId : null,
      enableTerminal: Boolean(hostData.enableTerminal),
      enableTunnel: Boolean(hostData.enableTunnel),
      enableFileManager: Boolean(hostData.enableFileManager),
      defaultPath: hostData.defaultPath || "/",
      tunnelConnections: hostData.tunnelConnections || [],
    };

    if (!submitData.enableTunnel) {
      submitData.tunnelConnections = [];
    }

    if (!submitData.enableFileManager) {
      submitData.defaultPath = "";
    }

    if (hostData.authType === "key" && hostData.key instanceof File) {
      const formData = new FormData();
      formData.append("key", hostData.key);

      const dataWithoutFile = { ...submitData };
      delete dataWithoutFile.key;
      formData.append("data", JSON.stringify(dataWithoutFile));

      const response = await sshHostApi.post("/db/host", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } else {
      const response = await sshHostApi.post("/db/host", submitData);
      return response.data;
    }
  } catch (error) {
    handleApiError(error, "create SSH host");
  }
}

export async function updateSSHHost(
  hostId: number,
  hostData: SSHHostData,
): Promise<SSHHost> {
  try {
    const submitData = {
      name: hostData.name || "",
      ip: hostData.ip,
      port: parseInt(hostData.port.toString()) || 22,
      username: hostData.username,
      folder: hostData.folder || "",
      tags: hostData.tags || [],
      pin: Boolean(hostData.pin),
      authType: hostData.authType,
      password: hostData.authType === "password" ? hostData.password : null,
      key: hostData.authType === "key" ? hostData.key : null,
      keyPassword: hostData.authType === "key" ? hostData.keyPassword : null,
      keyType: hostData.authType === "key" ? hostData.keyType : null,
      credentialId:
        hostData.authType === "credential" ? hostData.credentialId : null,
      enableTerminal: Boolean(hostData.enableTerminal),
      enableTunnel: Boolean(hostData.enableTunnel),
      enableFileManager: Boolean(hostData.enableFileManager),
      defaultPath: hostData.defaultPath || "/",
      tunnelConnections: hostData.tunnelConnections || [],
    };

    if (!submitData.enableTunnel) {
      submitData.tunnelConnections = [];
    }
    if (!submitData.enableFileManager) {
      submitData.defaultPath = "";
    }

    if (hostData.authType === "key" && hostData.key instanceof File) {
      const formData = new FormData();
      formData.append("key", hostData.key);

      const dataWithoutFile = { ...submitData };
      delete dataWithoutFile.key;
      formData.append("data", JSON.stringify(dataWithoutFile));

      const response = await sshHostApi.put(`/db/host/${hostId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } else {
      const response = await sshHostApi.put(`/db/host/${hostId}`, submitData);
      return response.data;
    }
  } catch (error) {
    handleApiError(error, "update SSH host");
  }
}

export async function bulkImportSSHHosts(hosts: SSHHostData[]): Promise<{
  message: string;
  success: number;
  failed: number;
  errors: string[];
}> {
  try {
    const response = await sshHostApi.post("/bulk-import", { hosts });
    return response.data;
  } catch (error) {
    handleApiError(error, "bulk import SSH hosts");
  }
}

export async function deleteSSHHost(hostId: number): Promise<any> {
  try {
    const response = await sshHostApi.delete(`/db/host/${hostId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "delete SSH host");
  }
}

export async function getSSHHostById(hostId: number): Promise<SSHHost> {
  try {
    const response = await sshHostApi.get(`/db/host/${hostId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch SSH host");
  }
}

// ============================================================================
// TUNNEL MANAGEMENT
// ============================================================================

export async function getTunnelStatuses(): Promise<
  Record<string, TunnelStatus>
> {
  try {
    const response = await tunnelApi.get("/tunnel/status");
    return response.data || {};
  } catch (error) {
    handleApiError(error, "fetch tunnel statuses");
  }
}

export async function getTunnelStatusByName(
  tunnelName: string,
): Promise<TunnelStatus | undefined> {
  const statuses = await getTunnelStatuses();
  return statuses[tunnelName];
}

export async function connectTunnel(tunnelConfig: TunnelConfig): Promise<any> {
  try {
    const response = await tunnelApi.post("/tunnel/connect", tunnelConfig);
    return response.data;
  } catch (error) {
    handleApiError(error, "connect tunnel");
  }
}

export async function disconnectTunnel(tunnelName: string): Promise<any> {
  try {
    const response = await tunnelApi.post("/tunnel/disconnect", { tunnelName });
    return response.data;
  } catch (error) {
    handleApiError(error, "disconnect tunnel");
  }
}

export async function cancelTunnel(tunnelName: string): Promise<any> {
  try {
    const response = await tunnelApi.post("/tunnel/cancel", { tunnelName });
    return response.data;
  } catch (error) {
    handleApiError(error, "cancel tunnel");
  }
}

// ============================================================================
// FILE MANAGER METADATA (Recent, Pinned, Shortcuts)
// ============================================================================

export async function getFileManagerRecent(
  hostId: number,
): Promise<FileManagerFile[]> {
  try {
    const response = await sshHostApi.get(
      `/file_manager/recent?hostId=${hostId}`,
    );
    return response.data || [];
  } catch (error) {
    return [];
  }
}

export async function addFileManagerRecent(
  file: FileManagerOperation,
): Promise<any> {
  try {
    const response = await sshHostApi.post("/file_manager/recent", file);
    return response.data;
  } catch (error) {
    handleApiError(error, "add recent file");
  }
}

export async function removeFileManagerRecent(
  file: FileManagerOperation,
): Promise<any> {
  try {
    const response = await sshHostApi.delete("/file_manager/recent", {
      data: file,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "remove recent file");
  }
}

export async function getFileManagerPinned(
  hostId: number,
): Promise<FileManagerFile[]> {
  try {
    const response = await sshHostApi.get(
      `/file_manager/pinned?hostId=${hostId}`,
    );
    return response.data || [];
  } catch (error) {
    return [];
  }
}

export async function addFileManagerPinned(
  file: FileManagerOperation,
): Promise<any> {
  try {
    const response = await sshHostApi.post("/file_manager/pinned", file);
    return response.data;
  } catch (error) {
    handleApiError(error, "add pinned file");
  }
}

export async function removeFileManagerPinned(
  file: FileManagerOperation,
): Promise<any> {
  try {
    const response = await sshHostApi.delete("/file_manager/pinned", {
      data: file,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "remove pinned file");
  }
}

export async function getFileManagerShortcuts(
  hostId: number,
): Promise<FileManagerShortcut[]> {
  try {
    const response = await sshHostApi.get(
      `/file_manager/shortcuts?hostId=${hostId}`,
    );
    return response.data || [];
  } catch (error) {
    return [];
  }
}

export async function addFileManagerShortcut(
  shortcut: FileManagerOperation,
): Promise<any> {
  try {
    const response = await sshHostApi.post("/file_manager/shortcuts", shortcut);
    return response.data;
  } catch (error) {
    handleApiError(error, "add shortcut");
  }
}

export async function removeFileManagerShortcut(
  shortcut: FileManagerOperation,
): Promise<any> {
  try {
    const response = await sshHostApi.delete("/file_manager/shortcuts", {
      data: shortcut,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "remove shortcut");
  }
}

// ============================================================================
// SSH FILE OPERATIONS
// ============================================================================

export async function connectSSH(
  sessionId: string,
  config: {
    hostId?: number;
    ip: string;
    port: number;
    username: string;
    password?: string;
    sshKey?: string;
    keyPassword?: string;
    authType?: string;
    credentialId?: number;
    userId?: string;
  },
): Promise<any> {
  try {
    const response = await fileManagerApi.post("/ssh/connect", {
      sessionId,
      ...config,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "connect SSH");
  }
}

export async function disconnectSSH(sessionId: string): Promise<any> {
  try {
    const response = await fileManagerApi.post("/ssh/disconnect", {
      sessionId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "disconnect SSH");
  }
}

export async function getSSHStatus(
  sessionId: string,
): Promise<{ connected: boolean }> {
  try {
    const response = await fileManagerApi.get("/ssh/status", {
      params: { sessionId },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "get SSH status");
  }
}

export async function listSSHFiles(
  sessionId: string,
  path: string,
): Promise<any[]> {
  try {
    const response = await fileManagerApi.get("/ssh/listFiles", {
      params: { sessionId, path },
    });
    return response.data || [];
  } catch (error) {
    handleApiError(error, "list SSH files");
  }
}

export async function readSSHFile(
  sessionId: string,
  path: string,
): Promise<{ content: string; path: string }> {
  try {
    const response = await fileManagerApi.get("/ssh/readFile", {
      params: { sessionId, path },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "read SSH file");
  }
}

export async function writeSSHFile(
  sessionId: string,
  path: string,
  content: string,
  hostId?: number,
  userId?: string,
): Promise<any> {
  try {
    const response = await fileManagerApi.post("/ssh/writeFile", {
      sessionId,
      path,
      content,
      hostId,
      userId,
    });

    if (
      response.data &&
      (response.data.message === "File written successfully" ||
        response.status === 200)
    ) {
      return response.data;
    } else {
      throw new Error("File write operation did not return success status");
    }
  } catch (error) {
    handleApiError(error, "write SSH file");
  }
}

export async function uploadSSHFile(
  sessionId: string,
  path: string,
  fileName: string,
  content: string,
  hostId?: number,
  userId?: string,
): Promise<any> {
  try {
    const response = await fileManagerApi.post("/ssh/uploadFile", {
      sessionId,
      path,
      fileName,
      content,
      hostId,
      userId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "upload SSH file");
  }
}

export async function createSSHFile(
  sessionId: string,
  path: string,
  fileName: string,
  content: string = "",
  hostId?: number,
  userId?: string,
): Promise<any> {
  try {
    const response = await fileManagerApi.post("/ssh/createFile", {
      sessionId,
      path,
      fileName,
      content,
      hostId,
      userId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "create SSH file");
  }
}

export async function createSSHFolder(
  sessionId: string,
  path: string,
  folderName: string,
  hostId?: number,
  userId?: string,
): Promise<any> {
  try {
    const response = await fileManagerApi.post("/ssh/createFolder", {
      sessionId,
      path,
      folderName,
      hostId,
      userId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "create SSH folder");
  }
}

export async function deleteSSHItem(
  sessionId: string,
  path: string,
  isDirectory: boolean,
  hostId?: number,
  userId?: string,
): Promise<any> {
  try {
    const response = await fileManagerApi.delete("/ssh/deleteItem", {
      data: {
        sessionId,
        path,
        isDirectory,
        hostId,
        userId,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "delete SSH item");
  }
}

export async function renameSSHItem(
  sessionId: string,
  oldPath: string,
  newName: string,
  hostId?: number,
  userId?: string,
): Promise<any> {
  try {
    const response = await fileManagerApi.put("/ssh/renameItem", {
      sessionId,
      oldPath,
      newName,
      hostId,
      userId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "rename SSH item");
  }
}

// ============================================================================
// SERVER STATISTICS
// ============================================================================

export async function getAllServerStatuses(): Promise<
  Record<number, ServerStatus>
> {
  try {
    const response = await statsApi.get("/status");
    return response.data || {};
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getRootBase(8085),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.get("/status");
        return response.data || {};
      } catch (e) {
        handleApiError(e, "fetch server statuses");
      }
    }
    handleApiError(error, "fetch server statuses");
  }
}

export async function getServerStatusById(id: number): Promise<ServerStatus> {
  try {
    const response = await statsApi.get(`/status/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getRootBase(8085),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.get(`/status/${id}`);
        return response.data;
      } catch (e) {
        handleApiError(e, "fetch server status");
      }
    }
    handleApiError(error, "fetch server status");
  }
}

export async function getServerMetricsById(id: number): Promise<ServerMetrics> {
  try {
    const response = await statsApi.get(`/metrics/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getRootBase(8085),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.get(`/metrics/${id}`);
        return response.data;
      } catch (e) {
        handleApiError(e, "fetch server metrics");
      }
    }
    handleApiError(error, "fetch server metrics");
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function registerUser(
  username: string,
  password: string,
): Promise<any> {
  try {
    const response = await authApi.post("/users/create", {
      username,
      password,
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getSshBase(8081),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.post("/users/create", {
          username,
          password,
        });
        return response.data;
      } catch (e) {
        handleApiError(e, "register user");
      }
    }
    handleApiError(error, "register user");
  }
}

export async function loginUser(
  username: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const response = await authApi.post("/users/login", { username, password });
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getSshBase(8081),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.post("/users/login", { username, password });
        return response.data;
      } catch (e) {
        handleApiError(e, "login user");
      }
    }
    handleApiError(error, "login user");
  }
}

export async function getUserInfo(): Promise<UserInfo> {
  try {
    const response = await authApi.get("/users/me");
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getSshBase(8081),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.get("/users/me");
        return response.data;
      } catch (e) {
        handleApiError(e, "fetch user info");
      }
    }
    handleApiError(error, "fetch user info");
  }
}

export async function getRegistrationAllowed(): Promise<{ allowed: boolean }> {
  try {
    const response = await authApi.get("/users/registration-allowed");
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const alt = axios.create({
          baseURL: getSshBase(8081),
          headers: { "Content-Type": "application/json" },
        });
        const response = await alt.get("/users/registration-allowed");
        return response.data;
      } catch (e) {
        handleApiError(e, "check registration status");
      }
    }
    handleApiError(error, "check registration status");
  }
}

export async function getUserCount(): Promise<UserCount> {
  try {
    const response = await authApi.get("/users/count");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch user count");
  }
}

export async function initiatePasswordReset(username: string): Promise<any> {
  try {
    const response = await authApi.post("/users/initiate-reset", { username });
    return response.data;
  } catch (error) {
    handleApiError(error, "initiate password reset");
  }
}

export async function verifyPasswordResetCode(
  username: string,
  resetCode: string,
): Promise<any> {
  try {
    const response = await authApi.post("/users/verify-reset-code", {
      username,
      resetCode,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "verify reset code");
  }
}

export async function completePasswordReset(
  username: string,
  tempToken: string,
  newPassword: string,
): Promise<any> {
  try {
    const response = await authApi.post("/users/complete-reset", {
      username,
      tempToken,
      newPassword,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "complete password reset");
  }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function getUserList(): Promise<{ users: UserInfo[] }> {
  try {
    const response = await authApi.get("/users/list");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch user list");
  }
}

export async function makeUserAdmin(username: string): Promise<any> {
  try {
    const response = await authApi.post("/users/make-admin", { username });
    return response.data;
  } catch (error) {
    handleApiError(error, "make user admin");
  }
}

export async function removeAdminStatus(username: string): Promise<any> {
  try {
    const response = await authApi.post("/users/remove-admin", { username });
    return response.data;
  } catch (error) {
    handleApiError(error, "remove admin status");
  }
}

export async function deleteUser(username: string): Promise<any> {
  try {
    const response = await authApi.delete("/users/delete-user", {
      data: { username },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "delete user");
  }
}

export async function deleteAccount(password: string): Promise<any> {
  try {
    const response = await authApi.delete("/users/delete-account", {
      data: { password },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "delete account");
  }
}

export async function updateRegistrationAllowed(
  allowed: boolean,
): Promise<any> {
  try {
    const response = await authApi.patch("/users/registration-allowed", {
      allowed,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "update registration allowed");
  }
}

// ============================================================================
// ALERTS
// ============================================================================

export async function setupTOTP(): Promise<{
  secret: string;
  qr_code: string;
}> {
  try {
    const response = await authApi.post("/users/totp/setup");
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, "setup TOTP");
    throw error;
  }
}

export async function enableTOTP(
  totp_code: string,
): Promise<{ message: string; backup_codes: string[] }> {
  try {
    const response = await authApi.post("/users/totp/enable", { totp_code });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, "enable TOTP");
    throw error;
  }
}

export async function disableTOTP(
  password?: string,
  totp_code?: string,
): Promise<{ message: string }> {
  try {
    const response = await authApi.post("/users/totp/disable", {
      password,
      totp_code,
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, "disable TOTP");
    throw error;
  }
}

export async function verifyTOTPLogin(
  temp_token: string,
  totp_code: string,
): Promise<AuthResponse> {
  try {
    const response = await authApi.post("/users/totp/verify-login", {
      temp_token,
      totp_code,
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, "verify TOTP login");
    throw error;
  }
}

export async function generateBackupCodes(
  password?: string,
  totp_code?: string,
): Promise<{ backup_codes: string[] }> {
  try {
    const response = await authApi.post("/users/totp/backup-codes", {
      password,
      totp_code,
    });
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError, "generate backup codes");
    throw error;
  }
}

export async function getUserAlerts(
  userId: string,
): Promise<{ alerts: any[] }> {
  try {
    const response = await authApi.get(`/alerts/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch user alerts");
  }
}

export async function dismissAlert(
  userId: string,
  alertId: string,
): Promise<any> {
  try {
    const response = await authApi.post("/alerts/dismiss", { userId, alertId });
    return response.data;
  } catch (error) {
    handleApiError(error, "dismiss alert");
  }
}

// ============================================================================
// UPDATES & RELEASES
// ============================================================================

export async function getReleasesRSS(perPage: number = 100): Promise<any> {
  try {
    const response = await authApi.get(`/releases/rss?per_page=${perPage}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch releases RSS");
  }
}

export async function getVersionInfo(): Promise<any> {
  try {
    const response = await authApi.get("/version");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch version info");
  }
}

// ============================================================================
// DATABASE HEALTH
// ============================================================================

export async function getDatabaseHealth(): Promise<any> {
  try {
    const response = await authApi.get("/users/db-health");
    return response.data;
  } catch (error) {
    handleApiError(error, "check database health");
  }
}

// ============================================================================
// SSH CREDENTIALS MANAGEMENT
// ============================================================================

export async function getCredentials(): Promise<any> {
  try {
    const response = await authApi.get("/credentials");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch credentials");
  }
}

export async function getCredentialDetails(credentialId: number): Promise<any> {
  try {
    const response = await authApi.get(`/credentials/${credentialId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch credential details");
  }
}

export async function createCredential(credentialData: any): Promise<any> {
  try {
    const response = await authApi.post("/credentials", credentialData);
    return response.data;
  } catch (error) {
    handleApiError(error, "create credential");
  }
}

export async function updateCredential(
  credentialId: number,
  credentialData: any,
): Promise<any> {
  try {
    const response = await authApi.put(
      `/credentials/${credentialId}`,
      credentialData,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "update credential");
  }
}

export async function deleteCredential(credentialId: number): Promise<any> {
  try {
    const response = await authApi.delete(`/credentials/${credentialId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "delete credential");
  }
}

export async function getCredentialHosts(credentialId: number): Promise<any> {
  try {
    const response = await authApi.get(`/credentials/${credentialId}/hosts`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch credential hosts");
  }
}

export async function getCredentialFolders(): Promise<any> {
  try {
    const response = await authApi.get("/credentials/folders");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch credential folders");
  }
}

// Get SSH host with resolved credentials
export async function getSSHHostWithCredentials(hostId: number): Promise<any> {
  try {
    const response = await sshHostApi.get(
      `/db/host/${hostId}/with-credentials`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch SSH host with credentials");
  }
}

// Apply credential to SSH host
export async function applyCredentialToHost(
  hostId: number,
  credentialId: number,
): Promise<any> {
  try {
    const response = await sshHostApi.post(
      `/db/host/${hostId}/apply-credential`,
      { credentialId },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "apply credential to host");
  }
}

// Remove credential from SSH host
export async function removeCredentialFromHost(hostId: number): Promise<any> {
  try {
    const response = await sshHostApi.delete(`/db/host/${hostId}/credential`);
    return response.data;
  } catch (error) {
    handleApiError(error, "remove credential from host");
  }
}

// Migrate host to managed credential
export async function migrateHostToCredential(
  hostId: number,
  credentialName: string,
): Promise<any> {
  try {
    const response = await sshHostApi.post(
      `/db/host/${hostId}/migrate-to-credential`,
      { credentialName },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "migrate host to credential");
  }
}

// ============================================================================
// TERMINAL WEBSOCKET CONNECTION
// ============================================================================

export function createTerminalWebSocket(): WebSocket | null {
  try {
    const serverUrl = getCurrentServerUrl();

    if (!serverUrl) {
      return null;
    }

    const wsProtocol = serverUrl.startsWith("https://") ? "wss://" : "ws://";
    const wsHost = serverUrl.replace(/^https?:\/\//, "");

    const cleanHost = wsHost.replace(/\/$/, "");
    const wsUrl = `${wsProtocol}${cleanHost}/ssh/websocket/`;

    return new WebSocket(wsUrl);
  } catch (error) {
    return null;
  }
}

export function connectToTerminalHost(
  ws: WebSocket,
  hostConfig: any,
  cols: number,
  rows: number,
): void {
  if (ws.readyState === WebSocket.OPEN) {
    const connectMessage = {
      type: "connectToHost",
      data: {
        cols,
        rows,
        hostConfig,
      },
    };

    ws.send(JSON.stringify(connectMessage));
  } else {
  }
}

export function sendTerminalInput(ws: WebSocket, input: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "input", data: input }));
  }
}

export function sendTerminalResize(
  ws: WebSocket,
  cols: number,
  rows: number,
): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "resize", data: { cols, rows } }));
  }
}

// ============================================================================
// SSH FOLDER MANAGEMENT
// ============================================================================

export async function getFoldersWithStats(): Promise<any> {
  try {
    const token = await getCookie("jwt");

    const tryFetch = async (base: string) => {
      const cleanBase = base.replace(/\/$/, "");
      const url = `${cleanBase}/db/folders/with-stats`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Termix-Mobile/1.0.0",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    };

    // Prefer /ssh base first, then root
    const sshBase = getSshBase(8081);
    let data = await tryFetch(sshBase);
    if (data === null) {
      const rootBase = getRootBase(8081);
      data = await tryFetch(rootBase);
    }
    return data;
  } catch {
    // Treat as optional; return null quietly
    return null;
  }
}

export async function renameFolder(
  oldName: string,
  newName: string,
): Promise<any> {
  try {
    const response = await authApi.put("/ssh/folders/rename", {
      oldName,
      newName,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "rename folder");
  }
}

export async function renameCredentialFolder(
  oldName: string,
  newName: string,
): Promise<any> {
  try {
    const response = await authApi.put("/credentials/folders/rename", {
      oldName,
      newName,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "rename credential folder");
  }
}
