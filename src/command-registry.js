export class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }

    register(name, handler) {
        if (this.commands.has(name)) {
            console.warn(`[WARN] Command "${name}" re-registered, overriding old handler.`);
        }
        this.commands.set(name, handler);
    }

    get(name) {
        return this.commands.get(name);
    }
}

export const registry = new CommandRegistry();