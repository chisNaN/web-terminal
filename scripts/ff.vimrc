" An example for a vimrc file.
"
" Maintainer:	Bram Moolenaar <Bram@vim.org>
" Last change:	2002 May 28
"
" To use it, copy it to
"     for Unix and OS/2:  ~/.vimrc
"	      for Amiga:  s:.vimrc
"  for MS-DOS and Win32:  $VIM\_vimrc
"	    for OpenVMS:  sys$login:.vimrc

" When started as "evim", evim.vim will already have done these settings.
if v:progname =~? "evim"
  finish
endif

" Switch Windows and maximize in one keypress
"set wmh=0
"map <C-J> <C-W>j<C-W>_
"map <C-K> <C-W>k<C-W>_
"map <C-N> <Esc>:bn<CR>
"map <C-P> <Esc>:bN<CR>

map <C-C> :s/^/\/\//<CR>

let g:miniBufExplMapWindowNavVim = 1 
let g:miniBufExplMapWindowNavArrows = 1 
let g:miniBufExplMapCTabSwitchBufs = 1 
let g:miniBufExplModSelTarget = 1 

" make tab sizes smaller (4 instead of 8) and all spaces...
set sw=2
set ts=2
set ic
set expandtab
set smarttab
" set smartindent
set cindent
:set comments=sl:/**,mb:\ *,elx:\ */
"colorscheme darkblue
"color darkblue
vnoremap p <Esc>:let current_reg = @"<CR>gvs<C-R>=current_reg<CR><Esc>

" Use Vim settings, rather then Vi settings (much better!).
" This must be first, because it changes other options as a side effect.
set nocompatible

" allow backspacing over everything in insert mode
set backspace=indent,eol,start

set ts=4
set autoindent		" always set autoindenting on
if has("vms")
  set nobackup		" do not keep a backup file, use versions instead
else
  set nobackup		" keep a backup file
set backupdir=./.backup,~/.backup,/tmp
endif
set history=50		" keep 50 lines of command line history
set ruler		" show the cursor position all the time
set showcmd		" display incomplete commands
set incsearch		" do incremental searching
set hlsearch

" For Win32 GUI: remove 't' flag from 'guioptions': no tearoff menu entries
" let &guioptions = substitute(&guioptions, "t", "", "g")

" Don't use Ex mode, use Q for formatting
map Q gq

" This is an alternative that also works in block mode, but the deleted
" text is lost and it only works for putting the current register.
"vnoremap p "_dp

" Switch syntax highlighting on, when the terminal has colors
" Also switch on highlighting the last used search pattern.
if &t_Co > 2 || has("gui_running")
  syntax on
  set hlsearch
endif
"colorscheme darkblue

" Only do this part when compiled with support for autocommands.
if has("autocmd")

  " Enable file type detection.
  " Use the default filetype settings, so that mail gets 'tw' set to 72,
  " 'cindent' is on in C files, etc.
  " Also load indent files, to automatically do language-dependent indenting.
  filetype plugin indent on

  " For all text files set 'textwidth' to 78 characters.
  autocmd FileType text setlocal textwidth=78

  " When editing a file, always jump to the last known cursor position.
  " Don't do it when the position is invalid or when inside an event handler
  " (happens when dropping a file on gvim).
  autocmd BufReadPost *
    \ if line("'\"") > 0 && line("'\"") <= line("$") |
    \   exe "normal g`\"" |
    \ endif

endif " has("autocmd")

nmap <space> za
nmap <F2> :cp<CR>
nmap <F3> :cn<CR>
nmap <F4> :grep <C-R>" *.cpp *.h <CR>
nmap <F5> :redraw! <CR>
nmap <F6> :tp<CR>
nmap <F7> :tn<CR>

"RENUMBER LINES, useful for lists
nmap <F8> :'<,'>! awk '/[0-9]+\. .*/ { $1 = i++ "."} {print}'<CR>
redraw!

" fix meta-keys which generate <esc>a .. <esc>z
"let c='a'
"while c != 'z'
"    exec "set <M-".toupper(c).">=\e".c
"    exec "imap \e".c." <M-".toupper(c).">"
"    let c = nr2char(1+char2nr(c))
"endw 

map o :silent .w !/opt/web-terminal/scripts/edit_in.sh<Return>
map q :silent .w :q!<Return>
