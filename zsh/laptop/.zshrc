# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=2000
SAVEHIST=2000
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename '/home/cody/.zshrc'

autoload -Uz compinit
compinit
# End of lines added by compinstall

### Everything below is user added ###

# Autocompletion
zstyle ':completion:*' menu select
zstyle ':completion::complete:*' gain-privileges 1
zstyle ':completion:*:descriptions' format '%U%B%d%b%u' 
zstyle ':completion:*:warnings' format '%BSorry, no matches for: %d%b' 
source /usr/share/zsh/site-functions/zsh-syntax-highlighting.zsh
source ~/repos/zsh-autosuggestions/zsh-autosuggestions.zsh

### Add PATH directories ###
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$HOME/bin:$PATH"
export PATH="$HOME/bin/swww_manager/:$PATH"
export PATH="$HOME/go/bin/:$PATH"
# export PATH="$HOME/bin/wofi/:$PATH"
# export PATH="$HOME/bin/scripts/:$PATH"
 
### Set GTK Theme ###
export GTK_THEME=Adwaita:dark

### Aliases ###
alias start='start_hyprland.sh'
alias setup='setup.sh'
alias hypr='start.sh'

alias ff="(firefox &) && exit"
alias brave="(brave-bin --enable-features=UseOzonePlatform --ozone-platform=wayland &) && exit"
alias bb="(brave-bin --enable-features=UseOzonePlatform --ozone-platform=wayland &) && exit"
alias lbw="(librewolf &) && exit"
alias e='nvim $(fzf)'
alias o='cd $(find * -type d | fzf)'
alias ls='eza -l'
alias lsa='eza -la'
alias v='nvim'
alias spotifyd="spotifyd --config-path /home/cody/.config/spotifyd/spotifyd.toml --no-daemon"
alias discord="($HOME/bin/webcord --enable-features=UseOzonePlatform --ozone-platform=wayland &) && exit"

# Git status info
autoload -Uz vcs_info
precmd() { vcs_info }
zstyle ':vcs_info:git:*' formats " %F{#e0af68} %b%f"
setopt prompt_subst

# Theme
# PROMPT='%F{#00ffff} % %F{#ffffff}%~${vcs_info_msg_0_}%f%F{#00ffff} 󰄾 %f'
PROMPT='%F{#7aa2f7} % %F{#ffffff}%~${vcs_info_msg_0_}%f%F{#f7768e} 󰄾 %f'

# Set default text editor
export VISUAL=nvim
export EDITOR=nvim

PATH="/home/cody/perl5/bin${PATH:+:${PATH}}"; export PATH;
PERL5LIB="/home/cody/perl5/lib/perl5${PERL5LIB:+:${PERL5LIB}}"; export PERL5LIB;
PERL_LOCAL_LIB_ROOT="/home/cody/perl5${PERL_LOCAL_LIB_ROOT:+:${PERL_LOCAL_LIB_ROOT}}"; export PERL_LOCAL_LIB_ROOT;
PERL_MB_OPT="--install_base \"/home/cody/perl5\""; export PERL_MB_OPT;
PERL_MM_OPT="INSTALL_BASE=/home/cody/perl5"; export PERL_MM_OPT;

# opam configuration
[[ ! -r /home/cody/.opam/opam-init/init.zsh ]] || source /home/cody/.opam/opam-init/init.zsh  > /dev/null 2> /dev/null

[ -f "/home/cody/.ghcup/env" ] && source "/home/cody/.ghcup/env" # ghcup-env
