local status_ok, comment = pcall(require, "Comment")
if not status_ok then
  return
end

comment.setup {
  pre_hook = function(ctx)
    local U = require "Comment.utils"

    local location = nil
    if ctx.ctype == U.ctype.block then
      location = require("ts_context_commentstring.utils").get_cursor_location()
    elseif ctx.cmotion == U.cmotion.v or ctx.cmotion == U.cmotion.V then
      location = require("ts_context_commentstring.utils").get_visual_start_location()
    end

    return require("ts_context_commentstring.internal").calculate_commentstring {
      key = ctx.ctype == U.ctype.line and "__default" or "__multiline",
      location = location,
    }
  end,
}
 
-- Smart comments
function _G.__toggle_contextual(vmode)
    local cfg = require('Comment.config'):get()
    local U = require('Comment.utils')
    local Op = require('Comment.opfunc')
    local range = U.get_region(vmode)
    local same_line = range.srow == range.erow

    local ctx = {
        cmode = U.cmode.toggle,
        range = range,
        cmotion = U.cmotion[vmode] or U.cmotion.line,
        ctype = same_line and U.ctype.linewise or U.ctype.blockwise,
    }

    local lcs, rcs = U.parse_cstr(cfg, ctx)
    local lines = U.get_lines(range)

    local params = {
        range = range,
        lines = lines,
        cfg = cfg,
        cmode = ctx.cmode,
        lcs = lcs,
        rcs = rcs,
    }

    if same_line then
        Op.linewise(params)
    else
        Op.blockwise(params)
    end
end

