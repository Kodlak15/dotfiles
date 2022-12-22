# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=1000
SAVEHIST=1000
bindkey -v
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename '/home/cody/.zshrc'

autoload -Uz compinit
source ~/Git/zsh-autosuggestions/zsh-autosuggestions.zsh

### End of lines added by compinstall ###

# Add version control information
autoload -Uz vcs_info
precmd() { vcs_info }

# Format the vcs_info_msg_0_ variable
# zstyle ':vcs_info:git:*' formats 'on branch %b'
zstyle ':vcs_info:git:*' formats ' %F{011} %b%f'

### Aliases ###

# General
alias ff="(firefox &) && exit"
alias spotify="(spotify &) && exit"
alias ls='exa -l'
alias lsa='exa -la'
alias code='code --enable-proposed-api ms-toolsai.jupyter'
alias conda-init='source /opt/anaconda/bin/activate'
alias nvim='lvim'
alias v='nvim'
alias rs='redshift -P -O'

# Fuzzy finding
alias o='cd $(find * -type d | fzf)'
alias e='nvim $(fzf)'

# Set default text editor
export VISUAL=lvim
export EDITOR=lvim

# Prompt
setopt PROMPT_SUBST
PROMPT='%F{#0099ff}%~%f${vcs_info_msg_0_}%F{#009933} %f '

# zsh syntax highlighting (needs to be at end of document)
source /home/cody/Git/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# LunarVim
export PATH=/home/cody/.local/bin:$PATH
