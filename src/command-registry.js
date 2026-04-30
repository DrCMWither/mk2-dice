export class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
        this.callbacks = [];
    }

    normalizeName(name) {
        return String(name || "").trim().toLowerCase();
    }

    register(name, spec) {
        const primary = this.normalizeName(name);
        const command = typeof spec === "function" ? { handler: spec } : spec;

        if (!command || typeof command.handler !== "function") {
            throw new TypeError(`Command "${primary}" must provide a handler.`);
        }

        if (this.commands.has(primary)) {
            console.warn(`[WARN] Command "${primary}" re-registered, overriding old handler.`);
        }

        this.commands.set(primary, {
            name: primary,
            aliases: [],
            parseMode: "HTML",
            ...command,
        });

        for (const alias of command.aliases || []) {
            this.alias(alias, primary);
        }

        return this;
    }

    alias(aliasName, primaryName) {
        const alias = this.normalizeName(aliasName);
        const primary = this.normalizeName(primaryName);

        if (!this.commands.has(primary)) {
            throw new Error(`Cannot alias "${alias}" to unknown command "${primary}".`);
        }

        this.aliases.set(alias, primary);
        return this;
    }

    get(name) {
        const key = this.normalizeName(name);
        const primary = this.aliases.get(key) || key;
        return this.commands.get(primary) || null;
    }

    parseCommand(text, botName) {
        const input = String(text || "").slice(0, 1024);
        const match = input.match(/^\/([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?(?:\s+([\s\S]+))?$/);

        if (!match) return null;

        const [, rawName, addressedBot, args = ""] = match;

        if (
            botName &&
            addressedBot &&
            addressedBot.toLowerCase() !== String(botName).toLowerCase()
        ) {
            return null;
        }

        const name = this.normalizeName(rawName);
        const command = this.get(name);

        if (!command) return null;

        return {
            name,
            args,
            command,
        };
    }

    registerCallback(name, spec) {
        if (!spec || typeof spec.handler !== "function") {
            throw new TypeError(`Callback "${name}" must provide a handler.`);
        }

        this.callbacks.push({
            name,
            ...spec,
        });

        return this;
    }

    matchCallback(data) {
        for (const callback of this.callbacks) {
            if (callback.match instanceof RegExp) {
                const match = String(data || "").match(callback.match);
                if (match) return { callback, match };
            }

            if (typeof callback.match === "function" && callback.match(data)) {
                return { callback, match: null };
            }

            if (typeof callback.match === "string" && String(data || "").startsWith(callback.match)) {
                return { callback, match: null };
            }
        }

        return null;
    }
}

export const registry = new CommandRegistry();