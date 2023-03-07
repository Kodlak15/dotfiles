local opts = { noremap = true, silent = true }
local term_opts = { silent = true }

local keymap = vim.api.nvim_set_keymap

-- Set leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- Modes
--     normal: 'n'
--     insert: 'i'
--     visual: 'v'
--     visual-block: 'x'
--     term: 't'
--     command: 'c'

--
-- Insert --
--

vim.keymap.set("i", "jk", "<Esc>")
vim.keymap.set("i", "kj", "<Esc>")

--
-- Normal --
--

-- Open file explorer
-- vim.keymap.set("n", "<leader><leader>", vim.cmd.Ex)

-- Navigate buffers
keymap("n", "<S-h>", ":bnext<CR>", opts)
keymap("n", "<S-l>", ":bprevious<CR>", opts)

-- Open file tree
-- keymap("n", "<leader>e", ":Lex 30<cr>", opts)

--
-- Visual --
--

-- Indenting
keymap("v", "<", "<gv", opts)
keymap("v", ">", ">gv", opts)

-- Move text up/down
keymap("v", "<A-j>", ":m .+1<CR>==", opts)
keymap("v", "<A-k>", ":m .-2<CR>==", opts)
keymap("v", "p", '"_dP', opts)

--
-- Visual block --
--
keymap("x", "J", ":move '>+1<CR>gv-gv", opts)
keymap("x", "K", ":move '<-2<CR>gv-gv", opts)
keymap("x", "<A-j>", ":move '>+1<CR>gv-gv", opts)
keymap("x", "<A-k>", ":move '<-2<CR>gv-gv", opts)

--
-- Telescope --
--
keymap("n", "<leader>;", "<cmd>Telescope find_files<cr>", opts)
keymap("n", "<c-t>", "<cmd>Telescope live_grep<cr>", opts)

--
-- Comments --
--
vim.keymap.set("n", "<leader>,", "<cmd>set operatorfunc=v:lua.__toggle_contextual<CR>g@l")
vim.keymap.set("x", "<leader>,", "<cmd>set operatorfunc=v:lua.__toggle_contextual<CR>g@l")

--
-- Nvim tree --
--
keymap("n", "<leader>e", ":NvimTreeToggle<cr>", opts)

--
-- Buffer navigation --
--
keymap("n", "<leader>c", "<cmd>Bdelete<CR>", opts)
keymap("n", "<leader>nn", "<cmd>BufferLineCycleNext<CR>", opts)
keymap("n", "<leader>bb", "<cmd>BufferLineCyclePrev<CR>", opts)

--
-- Formatting --
--
keymap("n", "<leader>f", ":Format<cr>", opts)