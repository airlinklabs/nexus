module.exports = {
  meta: { callerOnly: false },
  embeds: [{
    title: "Nexus UI Demo",
    description: "A test dialog with buttons and a select menu.",
    color: 0x5865f2,
    fields: [
      { name: "Status", value: "Select an option below", inline: true },
      { name: "Counter", value: "0", inline: true },
    ],
    footer: { text: "Powered by Nexus" },
  }],
  initialState: { counter: 0 },
  components: [
    [
      { type: "button", id: "increment", label: "+1", style: "success" },
      { type: "button", id: "decrement", label: "-1", style: "danger" },
      { type: "button", id: "reset", label: "Reset", style: "secondary" },
    ],
    [
      {
        type: "select", id: "color", placeholder: "Pick a color",
        options: [
          { value: "blue", label: "Blue" },
          { value: "green", label: "Green" },
          { value: "red", label: "Red" },
          { value: "purple", label: "Purple" },
        ],
      },
    ],
  ],
  handlers: {
    buttons: {
      increment: async function(ctx) {
        var n = (ctx.state.counter || 0) + 1;
        var embed = Object.assign({}, ctx.interaction.message.embeds[0]);
        var fields = embed.fields.map(function(f) {
          if (f.name === "Counter") return Object.assign({}, f, { value: String(n) });
          if (f.name === "Status") return Object.assign({}, f, { value: "Counter is now **" + n + "**" });
          return f;
        });
        await ctx.interaction.update({ embeds: [Object.assign({}, embed, { fields: fields })], components: ctx.interaction.message.components });
      },
      decrement: async function(ctx) {
        var n = (ctx.state.counter || 0) - 1;
        var embed = Object.assign({}, ctx.interaction.message.embeds[0]);
        var fields = embed.fields.map(function(f) {
          if (f.name === "Counter") return Object.assign({}, f, { value: String(n) });
          if (f.name === "Status") return Object.assign({}, f, { value: "Counter is now **" + n + "**" });
          return f;
        });
        await ctx.interaction.update({ embeds: [Object.assign({}, embed, { fields: fields })], components: ctx.interaction.message.components });
      },
      reset: async function(ctx) {
        var embed = Object.assign({}, ctx.interaction.message.embeds[0]);
        var fields = embed.fields.map(function(f) {
          if (f.name === "Counter") return Object.assign({}, f, { value: "0" });
          if (f.name === "Status") return Object.assign({}, f, { value: "Counter reset to **0**" });
          return f;
        });
        await ctx.interaction.update({ embeds: [Object.assign({}, embed, { fields: fields })], components: ctx.interaction.message.components });
      },
    },
    selects: {
      color: async function(ctx) {
        var colors = { blue: 0x5865f2, green: 0x57f287, red: 0xed4245, purple: 0x9b59b6 };
        var color = colors[ctx.values[0]] || 0x5865f2;
        var embed = Object.assign({}, ctx.interaction.message.embeds[0]);
        var fields = embed.fields.map(function(f) {
          if (f.name === "Status") return Object.assign({}, f, { value: "Color set to **" + ctx.values[0] + "**" });
          return f;
        });
        await ctx.interaction.update({ embeds: [Object.assign({}, embed, { color: color, fields: fields })], components: ctx.interaction.message.components });
      },
    },
  },
};
