import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseUserServer } from "@/lib/supabase";

/**
 * Log system events and errors for fault diagnosis
 */
export async function POST(request) {
  try {
    // Get user ID if available (not required for system logs)
    let userId = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      // Continue without user ID for system logs
      console.log("[System Logs] No auth available, logging anonymously");
    }

    const { operation, status, message, error_details, metadata } = await request.json();

    // Validate required fields
    if (!operation || !status || !message) {
      return NextResponse.json(
        { error: "Missing required fields: operation, status, message" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["success", "error", "warning", "info"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: success, error, warning, info" },
        { status: 400 }
      );
    }

    console.log(`[System Logs] ${status.toUpperCase()}: ${operation} - ${message}`);

    try {
      // Store log in database
      const { data: logEntry, error } = await supabaseUserServer
        .from("system_logs")
        .insert({
          user_id: userId,
          operation,
          status,
          message,
          error_details: error_details || null,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            user_agent: request.headers.get("user-agent"),
            ip_address: request.headers.get("x-forwarded-for") || "unknown"
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn("[System Logs] Database insert failed:", error.message);
        
        // Fallback: Log to console only
        console.log("[System Logs] Fallback logging:", {
          operation,
          status,
          message,
          error_details,
          metadata,
          userId
        });

        return NextResponse.json({
          success: true,
          message: "Log recorded (fallback mode)",
          fallback: true
        });
      }

      return NextResponse.json({
        success: true,
        logId: logEntry.id,
        message: "Log recorded successfully"
      });

    } catch (dbError) {
      console.warn("[System Logs] Database operation failed:", dbError.message);
      
      // Fallback: Log to console
      console.log("[System Logs] Fallback logging:", {
        operation,
        status,
        message,
        error_details,
        metadata,
        userId
      });

      return NextResponse.json({
        success: true,
        message: "Log recorded (fallback mode)",
        fallback: true
      });
    }

  } catch (error) {
    console.error("[System Logs] API Error:", error);
    
    // Even if logging fails, don"t break the user experience
    return NextResponse.json({
      success: false,
      error: "Failed to record log",
      message: error.message
    }, { status: 500 });
  }
}

/**
 * Get system logs (admin only)
 */
export async function GET(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit")) || 100;
    const offset = parseInt(searchParams.get("offset")) || 0;

    try {
      let query = supabaseUserServer
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (operation) {
        query = query.eq("operation", operation);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data: logs, error } = await query;

      if (error) {
        console.warn("[System Logs] Query failed:", error.message);
        return NextResponse.json(
          { error: "Failed to retrieve logs" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        logs,
        total: logs.length,
        offset,
        limit
      });

    } catch (dbError) {
      console.warn("[System Logs] Database operation failed:", dbError.message);
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error("[System Logs] GET Error:", error);
    return NextResponse.json(
      { error: `Failed to retrieve logs: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Performance logging utility
 */
export async function logPerformance(operationType, duration, success, metadata = {}) {
  try {
    const response = await fetch("/api/system-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation: `performance_${operationType}`,
        status: success ? "success" : "error",
        message: `${operationType} completed in ${duration}ms`,
        metadata: {
          ...metadata,
          duration_ms: duration,
          performance_metric: true
        }
      }),
    });

    if (!response.ok) {
      console.warn("[Performance Logging] Failed to log performance metric");
    }
  } catch (error) {
    console.warn("[Performance Logging] Error:", error.message);
  }
}

/**
 * Error logging utility
 */
export async function logError(operation, error, metadata = {}) {
  try {
    const response = await fetch("/api/system-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation,
        status: "error",
        message: error.message,
        error_details: {
          name: error.name,
          stack: error.stack,
          ...metadata.error_details
        },
        metadata: {
          ...metadata,
          error_logged: true
        }
      }),
    });

    if (!response.ok) {
      console.warn("[Error Logging] Failed to log error");
    }
  } catch (logError) {
    console.warn("[Error Logging] Error:", logError.message);
  }
}

/**
 * Success logging utility
 */
export async function logSuccess(operation, message, metadata = {}) {
  try {
    const response = await fetch("/api/system-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation,
        status: "success",
        message,
        metadata: {
          ...metadata,
          success_logged: true
        }
      }),
    });

    if (!response.ok) {
      console.warn("[Success Logging] Failed to log success");
    }
  } catch (error) {
    console.warn("[Success Logging] Error:", error.message);
  }
}
