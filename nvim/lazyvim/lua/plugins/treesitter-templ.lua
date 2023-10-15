return {
  {
    "vrischmann/tree-sitter-templ",
    opts = {
      install_info = {
        url = "https://github.com/vrischmann/tree-sitter-templ.git",
        files = { "src/parser.c", "src/scanner.c" },
        branch = "master",
      },
    },

    vim.treesitter.language.register("templ", "templ"),
  },
}
