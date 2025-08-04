// Input validation utilities for Edge Functions

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

/**
 * Validates and sanitizes email addresses
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }

  if (trimmedEmail.length > 254) {
    errors.push('Email address too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? trimmedEmail : undefined
  };
}

/**
 * Validates monetary amounts
 */
export function validateAmount(amount: any, options?: {
  min?: number;
  max?: number;
  currency?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (amount === null || amount === undefined) {
    errors.push('Amount is required');
    return { isValid: false, errors };
  }

  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    errors.push('Amount must be a number');
    return { isValid: false, errors };
  }

  if (numAmount < 0) {
    errors.push('Amount cannot be negative');
  }

  if (options?.min !== undefined && numAmount < options.min) {
    errors.push(`Amount must be at least ${options.min}`);
  }

  if (options?.max !== undefined && numAmount > options.max) {
    errors.push(`Amount cannot exceed ${options.max}`);
  }

  // Check for reasonable decimal places (2 for most currencies)
  const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    errors.push('Amount cannot have more than 2 decimal places');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? Math.round(numAmount * 100) / 100 : undefined
  };
}

/**
 * Validates order items array
 */
export function validateOrderItems(items: any): ValidationResult {
  const errors: string[] = [];
  
  if (!Array.isArray(items)) {
    errors.push('Items must be an array');
    return { isValid: false, errors };
  }

  if (items.length === 0) {
    errors.push('Order must contain at least one item');
    return { isValid: false, errors };
  }

  const sanitizedItems: any[] = [];
  
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Item ${index + 1}: Invalid item format`);
      return;
    }

    // Validate SKU
    if (!item.sku || typeof item.sku !== 'string') {
      errors.push(`Item ${index + 1}: SKU is required`);
    } else if (item.sku.length > 100) {
      errors.push(`Item ${index + 1}: SKU too long`);
    }

    // Validate quantity
    const quantity = parseInt(item.quantity);
    if (isNaN(quantity) || quantity < 1) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    } else if (quantity > 1000) {
      errors.push(`Item ${index + 1}: Quantity too large`);
    }

    // Validate price
    const priceValidation = validateAmount(item.unit_price, { min: 0, max: 1000000 });
    if (!priceValidation.isValid) {
      errors.push(`Item ${index + 1}: ${priceValidation.errors[0]}`);
    }

    if (errors.length === 0) {
      sanitizedItems.push({
        sku: item.sku.trim(),
        name: sanitizeString(item.name || item.sku),
        quantity: quantity,
        unit_price: priceValidation.sanitized,
        total_price: priceValidation.sanitized * quantity,
        attributes: sanitizeObject(item.attributes || {}),
        product_id: item.product_id ? sanitizeString(item.product_id) : null,
        variant_id: item.variant_id ? sanitizeString(item.variant_id) : null,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitizedItems : undefined
  };
}

/**
 * Validates address object
 */
export function validateAddress(address: any, required: boolean = false): ValidationResult {
  const errors: string[] = [];
  
  if (!address && required) {
    errors.push('Address is required');
    return { isValid: false, errors };
  }

  if (!address) {
    return { isValid: true, errors: [], sanitized: null };
  }

  if (typeof address !== 'object') {
    errors.push('Address must be an object');
    return { isValid: false, errors };
  }

  const sanitized: any = {};

  // Validate required fields
  if (!address.line1 || typeof address.line1 !== 'string') {
    errors.push('Address line 1 is required');
  } else {
    sanitized.line1 = sanitizeString(address.line1);
  }

  if (!address.city || typeof address.city !== 'string') {
    errors.push('City is required');
  } else {
    sanitized.city = sanitizeString(address.city);
  }

  if (!address.country || typeof address.country !== 'string') {
    errors.push('Country is required');
  } else {
    const country = address.country.toUpperCase();
    if (country.length !== 2) {
      errors.push('Country must be a 2-letter code');
    } else {
      sanitized.country = country;
    }
  }

  // Optional fields
  if (address.line2) {
    sanitized.line2 = sanitizeString(address.line2);
  }

  if (address.state) {
    sanitized.state = sanitizeString(address.state);
  }

  if (address.postal_code) {
    sanitized.postal_code = sanitizeString(address.postal_code);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
}

/**
 * Sanitizes a string by removing dangerous characters
 */
export function sanitizeString(input: any, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength);
}

/**
 * Sanitizes an object by removing dangerous content
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key, 50);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(v => 
        typeof v === 'string' ? sanitizeString(v) : v
      );
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
  }

  return sanitized;
}

/**
 * Validates webhook payload based on event type
 */
export function validateWebhookPayload(eventType: string, payload: any): ValidationResult {
  const errors: string[] = [];
  let sanitized: any = {};

  switch (eventType) {
    case 'order.created':
      // Validate order data
      if (!payload.order_id) {
        errors.push('Order ID is required');
      } else {
        sanitized.order_id = sanitizeString(payload.order_id);
      }

      const emailValidation = validateEmail(payload.customer_email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      } else {
        sanitized.customer_email = emailValidation.sanitized;
      }

      const itemsValidation = validateOrderItems(payload.items);
      if (!itemsValidation.isValid) {
        errors.push(...itemsValidation.errors);
      } else {
        sanitized.items = itemsValidation.sanitized;
      }

      const amountValidation = validateAmount(payload.total_amount, { min: 0 });
      if (!amountValidation.isValid) {
        errors.push(...amountValidation.errors);
      } else {
        sanitized.total_amount = amountValidation.sanitized;
      }

      // Validate addresses
      const shippingValidation = validateAddress(payload.shipping_address, true);
      if (!shippingValidation.isValid) {
        errors.push(...shippingValidation.errors.map(e => `Shipping: ${e}`));
      } else {
        sanitized.shipping_address = shippingValidation.sanitized;
      }

      break;

    case 'customer.created':
      // Validate customer data
      const customerEmailValidation = validateEmail(payload.email);
      if (!customerEmailValidation.isValid) {
        errors.push(...customerEmailValidation.errors);
      } else {
        sanitized.email = customerEmailValidation.sanitized;
      }

      if (payload.first_name) {
        sanitized.first_name = sanitizeString(payload.first_name, 100);
      }

      if (payload.last_name) {
        sanitized.last_name = sanitizeString(payload.last_name, 100);
      }

      break;

    default:
      // Generic validation for unknown event types
      sanitized = sanitizeObject(payload);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
}