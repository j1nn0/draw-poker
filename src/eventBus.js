const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
}

export function off(event, fn) {
  const set = listeners.get(event);
  if (set) set.delete(fn);
}

export function clear(event) {
  if (event) {
    listeners.delete(event);
  } else {
    listeners.clear();
  }
}

export function hasListeners(event) {
  const set = listeners.get(event);
  return !!set && set.size > 0;
}

export function emit(event, data) {
  const set = listeners.get(event);
  if (!set) return;
  for (const fn of [...set]) {
    try {
      fn(data);
    } catch (err) {
      console.error(`eventBus: listener for "${event}" threw`, err);
    }
  }
}
