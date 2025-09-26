import { Context, Next } from 'hono';
import { z } from 'zod';

/**
 * Middleware to validate request body with Zod schema
 */
export function validateJson<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set('validatedData', validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, 400);
      }
      
      return c.json({
        error: 'Invalid JSON',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  };
}

/**
 * Middleware to validate query parameters with Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      
      // Convert string values to appropriate types for validation
      const processedQuery: Record<string, any> = {};
      
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          processedQuery[key] = value;
          return;
        }
        
        // Try to convert strings to numbers
        if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
          processedQuery[key] = Number(value);
        } 
        // Try to convert string boolean values
        else if (value === 'true') {
          processedQuery[key] = true;
        }
        else if (value === 'false') {
          processedQuery[key] = false;
        }
        // Handle array parameters (e.g., ?tags=a&tags=b or ?tags=a,b)
        else if (Array.isArray(value)) {
          processedQuery[key] = value;
        }
        else if (typeof value === 'string' && value.includes(',')) {
          processedQuery[key] = value.split(',').map(item => item.trim());
        }
        else {
          processedQuery[key] = value;
        }
      });

      const validatedQuery = schema.parse(processedQuery);
      c.set('validatedQuery', validatedQuery);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Query validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, 400);
      }
      
      return c.json({
        error: 'Invalid query parameters',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  };
}

/**
 * Middleware to validate URL parameters with Zod schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validatedParams = schema.parse(params);
      c.set('validatedParams', validatedParams);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Parameter validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, 400);
      }
      
      return c.json({
        error: 'Invalid URL parameters',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  };
}

/**
 * Middleware to validate form data with Zod schema
 */
export function validateForm<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const formData = await c.req.formData();
      const data: Record<string, any> = {};
      
      // Convert FormData to plain object
      formData.forEach((value, key) => {
        if (data[key]) {
          // Handle multiple values for same key (convert to array)
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      });

      const validatedData = schema.parse(data);
      c.set('validatedData', validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Form validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, 400);
      }
      
      return c.json({
        error: 'Invalid form data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  };
}

declare module 'hono' {
  interface ContextVariableMap {
    validatedData: any;
    validatedQuery: any;
    validatedParams: any;
  }
}