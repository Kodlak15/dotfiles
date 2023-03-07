local fn = vim.fn

-- Automatically install packer
local install_path = fn.stdpath "data" .. "/site/pack/packer/start/packer.nvim"
if fn.empty(fn.glob(install_path)) > 0 then
    PACKER_BOOTSTRAP = fn.system {
        "git",
        "clone",
        "--depth",
        "1",
        "https://github.com/wbthomason/packer.nvim",
       install_path,
   }
    print "Installing packer -> close and reopen Neovim..."
    vim.cmd [[packadd packer.nvim]]
end

-- Autocommand that reloads neovim whenever plugins.lua is saved
vim.cmd [[
    augroup packer_user_config
        autocmd!
        autocmd BufWritePost plugins.lua source <afile> | PackerSync
    augroup end
]]

-- Use a protected call so we don't get an error on the first use
local status_ok, packer = pcall(require, "packer")
if not status_ok then
    return
end

-- Have packer use a popup window
packer.init {
    display = {
        open_fn = function()
            return require("packer.util").float { border = "rounded" }
        end,
    },
}

-- Install plugins 
return packer.startup(function(use)
    -- Install plugins here:
    use "wbthomason/packer.nvim"
    use "nvim-lua/popup.nvim"
    use "nvim-lua/plenary.nvim"
    use "windwp/nvim-autopairs"
    use "numToStr/Comment.nvim"
    use 'kyazdani42/nvim-web-devicons'
    use 'kyazdani42/nvim-tree.lua'
    use "akinsho/bufferline.nvim"
    use "moll/vim-bbye"

    -- Colorschemes
    use "folke/tokyonight.nvim"

    -- Completion
    use "hrsh7th/nvim-cmp"
    use "hrsh7th/cmp-buffer"
    use "hrsh7th/cmp-path"
    use "hrsh7th/cmp-cmdline"
    use "hrsh7th/cmp-nvim-lsp"
    use "hrsh7th/cmp-nvim-lua"
    use "saadparwaiz1/cmp_luasnip"

    -- Snippets
    use "L3MON4D3/LuaSnip"
    use "rafamadriz/friendly-snippets"

    -- LSP
    use "neovim/nvim-lspconfig"
    use "williamboman/mason.nvim"
    use "williamboman/mason-lspconfig.nvim"
    use "jose-elias-alvarez/null-ls.nvim"
    use "simrat39/rust-tools.nvim"

    -- Telescope (Fuzzy finding)
    use "nvim-telescope/telescope.nvim"
    use 'nvim-telescope/telescope-media-files.nvim'

    -- Treesitter (Syntax highlighting)
    use {
        "nvim-treesitter/nvim-treesitter",
        run = ":TSUpdate",
    }
    use "p00f/nvim-ts-rainbow"
    use "nvim-treesitter/playground"
    use "JoosepAlviste/nvim-ts-context-commentstring"

    -- Git 
    use "lewis6991/gitsigns.nvim"

    ----------------------------------------------------------------------

    -- Automatically set up configuration after cloning packer.nvim
    -- Put this at the end after all plugins
    if PACKER_BOOTSTRAP then
        require("packer").sync()
    end
end)
