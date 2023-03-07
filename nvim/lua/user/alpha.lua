local status_ok, _ = pcall(vim.cmd, "Alpha")

if not status_ok then
	vim.notify("Error loading alpha...")
	return
end
