const preprocessorSymbols = /#([^\s]*)(\s*)/gm;

class ConditionalState {
  elseIsValid = true;
  branches: {
    expression: boolean;
    string: string;
  }[] = [];

  constructor(initialExpression: boolean) {
    this.pushBranch('if', initialExpression);
  }

  pushBranch(token: string, expression: boolean) {
    if (!this.elseIsValid) {
      throw new Error(`#${token} not preceeded by an #if or #elif`);
    }
    this.elseIsValid = token === 'if' || token === 'elif';
    this.branches.push({
      expression: expression,
      string: '',
    });
  }

  appendStringToCurrentBranch(...strings: string[]) {
    for (const string of strings) {
      this.branches[this.branches.length - 1].string += string;
    }
  }

  resolve() {
    for (const branch of this.branches) {
      if (branch.expression) {
        // console.log(branch.string);
        return branch.string;
      }
    }
    return '';
  }
}

// Template literal tag that handles simple preprocessor symbols for WGSL
// shaders. Supports #if/elif/else/endif statements.
export function wgsl(strings: TemplateStringsArray, ...values: any[]) {
  // check values
  if (values.length > 0) {
    for (let i = 0; i < values.length; i++) {
      // 如果是function，直接调用
      if (typeof values[i] === 'function') {
        console.warn(
          'You are using a function as a value in the shader template, this is not recommended',
        );
        values[i] = values[i]();
      }
    }
  }

  const stateStack = [];
  let state = new ConditionalState(true);
  state.elseIsValid = false;
  let depth = 1;

  const assertTemplateFollows = (match: RegExpExecArray, string: string) => {
    if (match.index + match[0].length != string.length) {
      throw new Error(
        `#${match[1]} must be immediately followed by a template expression (ie: \${value})`,
      );
    }
  };

  for (let i = 0; i < strings.length; ++i) {
    const string = strings[i];
    const matchedSymbols = string.matchAll(preprocessorSymbols);

    let lastIndex = 0;
    let valueConsumed = false;

    for (const match of matchedSymbols) {
      state.appendStringToCurrentBranch(
        string.substring(lastIndex, match.index),
      );

      switch (match[1]) {
        case 'if':
          assertTemplateFollows(match, string);

          valueConsumed = true;
          stateStack.push(state);
          state = new ConditionalState(values[i]);
          break;
        case 'elif':
          assertTemplateFollows(match, string);

          valueConsumed = true;
          state.pushBranch(match[1], values[i]);
          break;
        case 'else':
          state.pushBranch(match[1], true);
          state.appendStringToCurrentBranch(match[2]);
          break;
        case 'endif':
          if (!stateStack.length) {
            throw new Error(`#${match[1]} not preceeded by an #if`);
          }

          const result = state.resolve();

          state = stateStack.pop() as ConditionalState;
          state.appendStringToCurrentBranch(result, match[2]);
          break;
        default:
          // Unknown preprocessor symbol. Emit it back into the output string unchanged.
          state.appendStringToCurrentBranch(match[0]);
          break;
      }

      lastIndex = match.index + match[0].length;
    }

    // If the string didn't end on one of the preprocessor symbols append the rest of it here.
    if (lastIndex != string.length) {
      state.appendStringToCurrentBranch(
        string.substring(lastIndex, string.length),
      );
    }

    // If the next value wasn't consumed by the preprocessor symbol, append it here.
    if (!valueConsumed && values.length > i) {
      state.appendStringToCurrentBranch(values[i]);
    }
  }

  if (stateStack.length) {
    throw new Error('Mismatched #if/#endif count');
  }

  return trimIndentation(state.resolve());
}

function trimIndentation(str: string): string {
  const lines = str.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const indentLengths = nonEmptyLines.map(
    (line) => line.match(/^(\s*)/)?.[0].length || 0,
  );
  const minIndent = Math.min(...indentLengths);

  return lines.map((line) => line.slice(minIndent)).join('\n');
}
