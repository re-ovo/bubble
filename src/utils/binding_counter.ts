import { wgsl } from '@/utils/processor';
import { BindGroupId } from '@/shader/groups';

/**
 * Provide a scope for the counter
 * @param scope the scope to provide
 * @returns the result of the scope
 */
export function providerWGSLCounterScope<T>(scope: () => T): T {
  if (counterContext != null) {
    throw new Error(
      ':( counterContext is not null, are you nesting counter scopes?',
    );
  }

  counterContext = new CounterContext();
  let result = scope();
  counterContext = null;
  return result;
}

let counterContext: CounterContext | null = null;

class CounterContext {
  private locationCounter: number = 0;
  private readonly bindingGroupCounter: Record<number, number> = {};

  constructor() {
    this.locationCounter = 0;
    this.bindingGroupCounter = {};
  }

  allocateLocation(): number {
    return this.locationCounter++;
  }

  allocateBindingGroup(group: number): number {
    if (this.bindingGroupCounter[group] == null) {
      this.bindingGroupCounter[group] = 0;
    }
    return this.bindingGroupCounter[group]++;
  }
}

/**
 * Auto allocate a binding for a group
 * @param group the group to allocate a binding for
 * @returns the binding
 */
export function autoBinding(group: BindGroupId): string {
  if (counterContext == null) throw new Error('counterContext is null');
  const binding = counterContext.allocateBindingGroup(group);
  return `@group(${group}) @binding(${binding})`;
}

/**
 * Auto allocate a location for a vertex attribute
 * @returns the location
 */
export function autoLocation(): number {
  if (counterContext == null) throw new Error('counterContext is null');
  return counterContext.allocateLocation();
}

/**
 * Auto allocate a texture and sampler binding for a texture
 * @param name the name of the texture
 * @param type the type of the texture
 * @returns the texture and sampler binding
 */
export function textureAndSampler(name: string, type: string): string {
  // group 1 is the texture, group 2 is the sampler
  return wgsl`
    ${autoBinding(BindGroupId.MATERIAL)} var ${name}: ${type};
    ${autoBinding(BindGroupId.MATERIAL)} var ${name}Sampler: sampler;
    `;
}
