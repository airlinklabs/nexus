import type {
  APIEmbed,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

// ─── Permission shapes ────────────────────────────────────────────────────────

export type RoleId = string & { readonly __brand: 'RoleId' };
export type UserId = string & { readonly __brand: 'UserId' };

export type PermissionTarget =
  | { readonly kind: 'roles'; readonly ids: ReadonlyArray<RoleId> }
  | { readonly kind: 'caller' }
  | { readonly kind: 'everyone' };

// ─── Component shapes ─────────────────────────────────────────────────────────

export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'link';

export type ButtonDef = {
  readonly type: 'button';
  readonly id: string;
  readonly label: string;
  readonly style: ButtonStyle;
  readonly emoji?: string;
  readonly disabled?: boolean;
  readonly url?: string;
  readonly allowedBy?: PermissionTarget;
  readonly cooldownSeconds?: number;
};

export type SelectOptionDef = {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly emoji?: string;
  readonly default?: boolean;
};

export type SelectMenuDef = {
  readonly type: 'select';
  readonly id: string;
  readonly placeholder: string;
  readonly minValues?: number;
  readonly maxValues?: number;
  readonly options: ReadonlyArray<SelectOptionDef>;
  readonly allowedBy?: PermissionTarget;
  readonly cooldownSeconds?: number;
};

export type ModalFieldDef = {
  readonly id: string;
  readonly label: string;
  readonly style: 'short' | 'paragraph';
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly value?: string;
};

export type ModalDef = {
  readonly type: 'modal';
  readonly id: string;
  readonly title: string;
  readonly fields: ReadonlyArray<ModalFieldDef>;
};

export type ComponentDef = ButtonDef | SelectMenuDef;

// ─── Interaction context ──────────────────────────────────────────────────────

export type ButtonContext = {
  readonly interaction: ButtonInteraction;
  readonly state: Record<string, unknown>;
  readonly callerId: UserId;
};

export type SelectContext = {
  readonly interaction: StringSelectMenuInteraction;
  readonly values: ReadonlyArray<string>;
  readonly state: Record<string, unknown>;
  readonly callerId: UserId;
};

export type ModalContext = {
  readonly interaction: ModalSubmitInteraction;
  readonly fields: Record<string, string>;
  readonly state: Record<string, unknown>;
  readonly callerId: UserId;
};

// ─── Handler shapes ───────────────────────────────────────────────────────────

export type ButtonHandler = (ctx: ButtonContext) => Promise<void>;
export type SelectHandler = (ctx: SelectContext) => Promise<void>;
export type ModalHandler = (ctx: ModalContext) => Promise<void>;

// ─── Page shape (for wizard / paginated embed) ────────────────────────────────

export type PageDef = {
  readonly embed: APIEmbed;
  readonly components?: ReadonlyArray<ReadonlyArray<ComponentDef>>;
};

// ─── The definition ───────────────────────────────────────────────────────────

export type UIDefinitionMeta = {
  readonly callerOnly?: boolean;
  readonly allowedBy?: PermissionTarget;
  readonly expiresInSeconds?: number;
  readonly ephemeral?: boolean;
};

export type UIDefinition = {
  readonly meta: UIDefinitionMeta;
  readonly embeds?: ReadonlyArray<APIEmbed>;
  readonly pages?: ReadonlyArray<PageDef>;
  readonly components?: ReadonlyArray<ReadonlyArray<ComponentDef>>;
  readonly initialState?: Record<string, unknown>;
  readonly handlers?: {
    readonly buttons?: Record<string, ButtonHandler>;
    readonly selects?: Record<string, SelectHandler>;
    readonly modals?: Record<string, ModalHandler>;
  };
  readonly modals?: Record<string, ModalDef>;
};

// ─── Stored message record (what the bot persists per sent message) ───────────

export type StoredMessage = {
  readonly messageId: string;
  readonly channelId: string;
  readonly guildId: string;
  readonly callerId: UserId;
  readonly definition: UIDefinition;
  readonly state: Record<string, unknown>;
  readonly expiresAt: number | null;
};

// ─── Poll types ───────────────────────────────────────────────────────────────

export type PollVote = {
  readonly userId: string;
  readonly optionValue: string;
  readonly votedAt: number;
};

export type PollState = {
  readonly __type: 'poll';
  readonly votes: ReadonlyArray<PollVote>;
  readonly closed: boolean;
};

export type PollMeta = UIDefinitionMeta & {
  readonly allowMultipleVotes?: boolean;
  readonly showVoterCount?: boolean;
  readonly showPercentages?: boolean;
  readonly anonymous?: boolean;
};
