/**
 * Shader macro preprocessor
 * 
 * Supported macros:
 * - #define
 * - #if
 * - #else
 * - #endif
 */

export function preprocessShader(shader: string): string {
    let processedShader = shader;
    processedShader = preprocessDefine(processedShader);
    processedShader = preprocessConditional(processedShader);
    return processedShader;
}

// #define MACRO VALUE
// 将所有 #define 宏替换为对应的值并删除宏定义
function preprocessDefine(shader: string): string {
    const defineRegex = /#define\s+(\w+)\s+(.*)/g;
    const defines = new Map<string, string>();
    let match;

    // 收集所有的宏定义
    while ((match = defineRegex.exec(shader)) !== null) {
        defines.set(match[1], match[2]);
    }

    // 删除所有的宏定义
    shader = shader.replace(defineRegex, '');

    // 替换所有的宏定义
    defines.forEach((value, key) => {
        const macroRegex = new RegExp(`\\b${key}\\b`, 'g');
        shader = shader.replace(macroRegex, value);
    });

    return shader;
}

interface IfState {
    condition: boolean;
    hasElse: boolean;
    keeping: boolean;
}

function preprocessConditional(shader: string): string {
    const lines = shader.split('\n');
    const stack: IfState[] = [];
    const resultLines: string[] = [];
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        
        // 处理 #if 指令
        if (trimmedLine.startsWith('#if')) {
            const condition = evaluateCondition(trimmedLine.substring(3).trim());
            stack.push({
                condition: condition,
                hasElse: false,
                keeping: condition
            });
            continue;
        }
        
        // 处理 #else 指令
        if (trimmedLine === '#else') {
            if (stack.length === 0) {
                throw new Error('Unexpected #else without #if');
            }
            const current = stack[stack.length - 1];
            current.hasElse = true;
            current.keeping = !current.condition;
            continue;
        }
        
        // 处理 #endif 指令
        if (trimmedLine === '#endif') {
            if (stack.length === 0) {
                throw new Error('Unexpected #endif without #if');
            }
            stack.pop();
            continue;
        }
        
        // 检查是否应该保留当前行
        const shouldKeepLine = stack.every(state => state.keeping);
        if (shouldKeepLine) {
            resultLines.push(line);
        }
    }
    
    if (stack.length > 0) {
        throw new Error('Unclosed #if directive');
    }
    
    return resultLines.join('\n');
}

function evaluateCondition(expression: string): boolean {
    // 移除所有空格
    expression = expression.replace(/\s+/g, '');
    
    // 支持基本的比较操作符
    if (expression.includes('>')) {
        const [left, right] = expression.split('>').map(parseFloat);
        return left > right;
    }
    if (expression.includes('<')) {
        const [left, right] = expression.split('<').map(parseFloat);
        return left < right;
    }
    if (expression.includes('>=')) {
        const [left, right] = expression.split('>=').map(parseFloat);
        return left >= right;
    }
    if (expression.includes('<=')) {
        const [left, right] = expression.split('<=').map(parseFloat);
        return left <= right;
    }
    if (expression.includes('==')) {
        const [left, right] = expression.split('==').map(parseFloat);
        return left === right;
    }
    if (expression.includes('!=')) {
        const [left, right] = expression.split('!=').map(parseFloat);
        return left !== right;
    }
    
    // 如果没有操作符，尝试将表达式解析为布尔值或数字
    const value = parseFloat(expression);
    return !isNaN(value) ? value !== 0 : Boolean(expression);
}