return {
  "hrsh7th/cmp-nvim-lsp",
  cond = function()
    return require("lazyvim.util").has("nvim-cmp")
  end,
  -- Below not working
  opts = function(_, opts)
    opts.mapping = {
      ["<C-k>"] = function()
        require("cmp.config.mapping").select_prev_item()
      end,
      ["<C-j>"] = function()
        require("cmp.config.mapping").select_next_item()
      end,
      ["<Tab>"] = function()
        require("cmp.config.mapping").select_next_item()
      end,
    }
  end,
}
