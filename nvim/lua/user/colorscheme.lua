-- Set defualt colorscheme
local colorscheme = "tokyonight-night"

-- Two dots (..) means string concatenation
-- pcall returns a status code as well as a result (if successful)
local status_ok, _ = pcall(vim.cmd, "colorscheme " .. colorscheme)

if not status_ok then 
    vim.notify("colorsheme " .. colorscheme .. " not found!")
    return
end
