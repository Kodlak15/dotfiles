-- Modes
--     normal: 'n'
--     insert: 'i'
--     visual: 'v'
--     visual-block: 'x'
--     term: 't'
--     command: 'c'

local opts = { noremap = true, silent = true }
-- local term_opts = { silent = true }

local keymap = vim.api.nvim_set_keymap

-- Set leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "
vim.g.maplocalleader = " "

--
-- Insert mode
--

-- NOTE: having an issue with delay after exiting insert mode when final key
-- pressed is either j or k
keymap("i", "jk", "<Esc>", opts)
keymap("i", "kj", "<Esc>", opts)

--
-- Normal mode
--

-- Navigate buffers
keymap("n", "<S-l>", ":bnext<CR>", opts)
keymap("n", "<S-h>", ":bprevious<CR>", opts)

--
-- Visual mode
--

-- Indenting
keymap("v", "<", "<gv", opts)
keymap("v", ">", ">gv", opts)

-- Move text up/down
keymap("v", "<A-j>", ":m .+1<CR>==", opts)
keymap("v", "<A-k>", ":m .-2<CR>==", opts)
keymap("v", "p", '"_dP', opts)

--
-- Visual block mode
--
keymap("x", "J", ":move '>+1<CR>gv-gv", opts)
keymap("x", "K", ":move '<-2<CR>gv-gv", opts)
keymap("x", "<A-j>", ":move '>+1<CR>gv-gv", opts)
keymap("x", "<A-k>", ":move '<-2<CR>gv-gv", opts)

--
-- Plugins
--

-- Telescope --
-- keymap("n", "<leader>;", "<cmd>Telescope find_files<cr>", opts)
keymap("n", "<leader><leader>", "<cmd>Telescope find_files<cr>", opts)
keymap("n", "<c-t>", "<cmd>Telescope live_grep<cr>", opts)

-- Comments --
keymap("n", "<leader>/", "<cmd>lua require('Comment.api').toggle.linewise.current()<CR>", opts)
keymap("x", "<leader>/", "<esc><cmd>lua require('Comment.api').toggle.linewise(vim.fn.visualmode())<CR>", opts)

-- Nvim tree --
keymap("n", "<leader>e", ":NvimTreeToggle<cr>", opts)

-- Buffer navigation --
keymap("n", "<leader>c", "<cmd>Bdelete<CR>", opts)
keymap("n", "<leader>nn", "<cmd>BufferLineCycleNext<CR>", opts)
keymap("n", "<leader>bb", "<cmd>BufferLineCyclePrev<CR>", opts)

-- Formatting --
keymap("n", "<leader>f", ":Format<cr>", opts)
-- keymap("n", "<leader>f", "<cmd>lua vim.lsp.buf.format()<CR>", opts)

-- Dashboard --
-- keymap("n", "<leader><leader>", ":Alpha<cr>", opts)
keymap("n", "<leader>;", ":Alpha<cr>", opts)
