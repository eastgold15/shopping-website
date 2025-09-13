# 网站配置处理系统优化指南

## 优化概述

原始的配置处理逻辑使用了大量的 if-else 条件判断，存在以下问题：
- 代码冗余，难以维护
- 添加新配置类型需要修改多处代码
- 类型处理逻辑分散，容易出错
- 缺乏统一的数据转换标准

## 新的策略模式设计

### 1. 配置处理器（Processors）

```typescript
const configProcessors = {
  number: (value: string, defaultValue: number = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  },
  boolean: (value: string, defaultValue: boolean = false) => {
    return value === "true" || (value === "" && defaultValue);
  },
  jsonArray: (value: string, defaultValue: any[] = []) => {
    try {
      return JSON.parse(value || JSON.stringify(defaultValue));
    } catch {
      return defaultValue;
    }
  },
  string: (value: string, defaultValue: string = "") => {
    return value || defaultValue;
  }
};
```

### 2. 配置类型映射表（Type Map）

```typescript
const configTypeMap: Record<string, {
  type: keyof typeof configProcessors;
  defaultValue?: any;
  target?: 'form' | 'ref';
  refName?: string;
}> = {
  // 数字类型
  free_shipping_threshold: { type: 'number', defaultValue: 59 },
  
  // 布尔类型
  nav_home_enabled: { type: 'boolean', defaultValue: true },
  
  // JSON数组类型（存储到ref）
  header_help_links: {
    type: 'jsonArray',
    defaultValue: [{ text: "Help", url: "/help" }],
    target: 'ref',
    refName: 'headerHelpLinks'
  }
};
```

### 3. 序列化器（Serializers）

```typescript
const configSerializers = {
  number: (value: number) => String(value),
  boolean: (value: boolean) => value ? "true" : "false",
  jsonArray: (value: any[]) => JSON.stringify(value),
  string: (value: string) => value
};
```

## 优势对比

### 原始方式（Before）
```typescript
// 加载时需要大量if-else
if (config.key === "free_shipping_threshold") {
  configData[config.key] = Number(config.value) || 59;
} else if (config.key === "header_help_links") {
  try {
    headerHelpLinks.value = JSON.parse(config.value || '[{"text":"Help","url":"/help"}]');
  } catch {
    headerHelpLinks.value = [{ text: "Help", url: "/help" }];
  }
} else if (config.key.includes("_enabled")) {
  configData[config.key] = config.value === "true";
} else {
  configData[config.key] = config.value || "";
}

// 保存时也需要重复的类型判断
if (typeof value === "boolean") {
  stringValue = value ? "true" : "false";
}
```

### 优化后方式（After）
```typescript
// 加载时统一处理
const processedValue = processConfigValue(config.key, config.value);
if (configMeta?.target === 'ref' && configMeta.refName) {
  const targetRef = configMeta.refName === 'headerHelpLinks' ? headerHelpLinks : footerSections;
  targetRef.value = processedValue;
} else {
  configData[config.key] = processedValue;
}

// 保存时统一序列化
const updateData = Object.entries(formData.values).map(([key, value]) => ({
  key,
  value: serializeConfigValue(key, value)
}));
```

## 如何添加新的配置类型

### 1. 添加简单配置

```typescript
// 在 configTypeMap 中添加新配置
const configTypeMap = {
  // ... 现有配置
  
  // 新增数字类型配置
  max_cart_items: { type: 'number', defaultValue: 10 },
  
  // 新增布尔类型配置
  enable_wishlist: { type: 'boolean', defaultValue: false },
  
  // 新增字符串配置（可省略，默认就是string类型）
  contact_email: { type: 'string', defaultValue: 'support@example.com' }
};
```

### 2. 添加复杂配置（需要存储到ref）

```typescript
// 1. 先创建对应的ref
const socialLinks = ref([{ platform: 'facebook', url: '' }]);

// 2. 在configTypeMap中配置
const configTypeMap = {
  // ... 现有配置
  
  social_links: {
    type: 'jsonArray',
    defaultValue: [{ platform: 'facebook', url: '' }],
    target: 'ref',
    refName: 'socialLinks'
  }
};

// 3. 更新ref处理逻辑（如果需要）
if (configMeta?.target === 'ref' && configMeta.refName) {
  const refMap = {
    'headerHelpLinks': headerHelpLinks,
    'footerSections': footerSections,
    'socialLinks': socialLinks  // 新增
  };
  const targetRef = refMap[configMeta.refName];
  if (targetRef) {
    targetRef.value = processedValue;
  }
}
```

### 3. 添加新的数据类型处理器

```typescript
// 如果需要新的数据类型，可以扩展处理器
const configProcessors = {
  // ... 现有处理器
  
  // 新增日期类型处理器
  date: (value: string, defaultValue: string = '') => {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? defaultValue : value;
    } catch {
      return defaultValue;
    }
  },
  
  // 新增URL类型处理器
  url: (value: string, defaultValue: string = '') => {
    try {
      new URL(value);
      return value;
    } catch {
      return defaultValue;
    }
  }
};

// 对应的序列化器
const configSerializers = {
  // ... 现有序列化器
  
  date: (value: string) => value,
  url: (value: string) => value
};
```

## 最佳实践

1. **类型安全**：使用 TypeScript 确保类型映射的正确性
2. **默认值**：为每个配置项提供合理的默认值
3. **错误处理**：在处理器中包含错误处理逻辑
4. **文档注释**：为复杂的配置项添加注释说明
5. **测试**：为新增的配置类型编写单元测试

## 总结

通过策略模式重构，我们实现了：
- ✅ **可扩展性**：添加新配置类型只需在映射表中配置
- ✅ **可维护性**：统一的处理逻辑，减少代码重复
- ✅ **类型安全**：TypeScript 类型检查确保正确性
- ✅ **错误处理**：统一的错误处理和默认值机制
- ✅ **代码清晰**：逻辑分离，职责单一

这种设计模式可以轻松应对未来的配置需求变化，大大提高了代码的质量和开发效率。