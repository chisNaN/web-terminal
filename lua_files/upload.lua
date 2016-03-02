-- helper functions
-- escape should be used with strings before they are used as patterns with gsub or gmatch
function escape(x)
  return (x:gsub('%%', '%%%%')
           :gsub('%^', '%%%^')
           :gsub('%$', '%%%$')
           :gsub('%(', '%%%(')
           :gsub('%)', '%%%)')
           :gsub('%.', '%%%.')
           :gsub('%[', '%%%[')
           :gsub('%]', '%%%]')
           :gsub('%*', '%%%*')
           :gsub('%+', '%%%+')
           :gsub('%-', '%%%-')
           :gsub('%?', '%%%?'))
end

-- This should be used on the file paths to make them safe to use as a console command
-- Quotes are replaced with quote backslash quote quote and the string is wrapped in single quotes
-- This prevents console injection and env variable substitution.
-- example: jesse's file.txt -> 'jesse'\''s file.txt'
function escapeForShell(x)
  return "'"..string.gsub(x, "'", "'\\''").."'"
end

-- get output from system calls
function os.capture(cmd, raw)
  local f = assert(io.popen(cmd, 'r'))
  local s = assert(f:read('*a'))
  f:close()
  if raw then return s end
  s = string.gsub(s, '^%s+', '')
  s = string.gsub(s, '%s+$', '')
  s = string.gsub(s, '[\n\r]+', ' ')
  return s
end

-- load upload progress shared dictionary
local upload_progress = ngx.shared.upload_progress
local upload_dir = "/tmp/"
local completed_dir = ngx.unescape_uri(ngx.var["arg_upload_path"])

-- load JSON, and response skeleton
local cjson = require "cjson"
local response = {}

-- get uid from query string, and content-length from header
local uid = ngx.var["arg_upload_uid"]

local file_path = ngx.req.get_headers()["File-Path"]
local chunk_total = ngx.req.get_headers()["Chunk-Total"]
local chunk_size = ngx.req.get_headers()["Chunk-Size"]
local chunk_number = ngx.req.get_headers()["Chunk-Number"]
local chunk_hash = ngx.req.get_headers()["Chunk-Hash"]
local file_hash = ngx.req.get_headers()["File-Hash"]

-- check that all the headers are there
if not chunk_total then
  ngx.log(ngx.ERR,"No Chunk-Total header.")
  return
end

if not chunk_number then
  ngx.log(ngx.ERR,"No Chunk-Number header.")
  return
end

if not file_path then
  ngx.log(ngx.ERR,"No File-path header.")
  return
end

if not chunk_size then
  ngx.log(ngx.ERR,"No Chunk-Size header.")
  return
end

if not chunk_hash then
  ngx.log(ngx.ERR,"No Chunk-Hash header.")
  return
end

local chunk

if tonumber(chunk_size) > 0 then
  -- set response variable
  response["chunkNumber"] = chunk_number
  response["expectedChunks"] = chunk_total

  -- get chunk data
  ngx.req.read_body()
  chunk = ngx.req.get_body_data()
  local resty_sha1 = require "resty.sha1"

  local sha1 = resty_sha1:new()
  if not sha1 then
      ngx.log(ngx.ERR,"failed to create the sha1 object.")
      return
  end

  local ok = sha1:update(chunk)
  if not ok then
      ngx.log(ngx.ERR,"failed to add data")
      return
  end

  local digest = sha1:final()  -- binary digest

  local str = require "resty.string"
  local hash = str.to_hex(digest)

  if not chunk then
    ngx.log(ngx.ERR,"No chunk data.")
    response["status"] = "error"
    ngx.say(cjson.encode(response))
    return
  end

  response["chunk-hash"] = hash

  if chunk_hash ~= hash then
    ngx.log(ngx.ERR,"Hash mismatch, server: "..hash..", client: "..chunk_hash..", chunk number: ", chunk_number)
    response["status"] = "failure"
    ngx.say(cjson.encode(response))
    return
  end
end

local folder_path, file_name, file, upload_file_name, dest_folder, dest_file_name, upload_prog

file_name = file_path:gsub("(.+)/", "")

if file_path:find("/") then
  folder_path = file_path:gsub("/"..escape(file_name), "").."/"
  
  local mkdir_path = upload_dir..folder_path:gsub("%s", "\\ ")
  local mkdir = os.execute("mkdir -p "..escapeForShell(mkdir_path))
  if mkdir ~= 0 then
    ngx.log(ngx.ERR, "mkdir -p error "..mkdir)
    response["status"] = "error"
    ngx.say(cjson.encode(response))
    return
  end
  upload_file_name = upload_dir..folder_path..file_name
  dest_folder = completed_dir..folder_path
  dest_file_name = completed_dir..folder_path..file_name
else
  upload_file_name = upload_dir..file_name
  dest_folder = completed_dir
  dest_file_name = completed_dir..file_name
end

-- create file on disk
local write_mod

if tonumber(chunk_number) == 1 then
  write_mod = "w+"
else
  write_mod = "a"
end

file = io.open(upload_file_name, write_mod)

if not file then
  ngx.log(ngx.ERR, "Failed to open file: ", upload_file_name)
  response["status"] = "error"
  ngx.say(cjson.encode(response))
  return
end

--write to file and then close
if tonumber(chunk_size) > 0 then
  file:write(chunk)
end
file:flush()

--move file to upload_path
if chunk_number == chunk_total then
  local mv, sha1
  if folder_path then
    mkdir = os.capture("mkdir -p "..escapeForShell(dest_folder))
  end

  mv = os.capture("mv -f "..escapeForShell(upload_file_name).." "..escapeForShell(dest_folder))
  sha1 = os.capture("sha1sum "..escapeForShell(dest_file_name))
  
  if sha1 and sha1:find(" ") then
    response["file-hash"] = sha1:sub(1,sha1:find(" ")-1)
  end

end

response["status"] = "success"
ngx.say(cjson.encode(response))
