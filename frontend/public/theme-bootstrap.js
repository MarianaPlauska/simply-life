// Boot de tema antes do React — evita flash ao recarregar
(function ()
{
  var THEME_DARK = '#1D2029'
  var THEME_LIGHT = '#F4F4F2'
  var STORE = 'simply-life-store'

  function schemeFromRaw(raw)
  {
    if (!raw) return null
    try
    {
      var parsed = JSON.parse(raw)
      var cs = parsed && parsed.state && parsed.state.accessibility && parsed.state.accessibility.colorScheme
      if (cs === 'dark' || cs === 'light') return cs
      if (cs === 'sepia') return 'light'
    }
    catch (e) { /* ignore */ }
    return null
  }

  function supabaseUserId()
  {
    try
    {
      for (var i = 0; i < localStorage.length; i++)
      {
        var key = localStorage.key(i)
        if (!key || key.indexOf('sb-') !== 0 || key.indexOf('-auth-token') < 0) continue
        var raw = localStorage.getItem(key)
        if (!raw) continue
        var parsed = JSON.parse(raw)
        var uid = (parsed.user && parsed.user.id) || (parsed.currentSession && parsed.currentSession.user && parsed.currentSession.user.id)
        if (uid) return uid
      }
    }
    catch (e) { /* ignore */ }
    return null
  }

  function readScheme()
  {
    var keys = []
    var uid = supabaseUserId()
    if (uid) keys.push(STORE + ':' + uid)
    keys.push(STORE + ':anonymous')
    keys.push(STORE)

    try
    {
      for (var j = 0; j < localStorage.length; j++)
      {
        var k = localStorage.key(j)
        if (k && k.indexOf(STORE + ':') === 0) keys.push(k)
      }
    }
    catch (e) { /* ignore */ }

    var seen = {}
    for (var n = 0; n < keys.length; n++)
    {
      var key = keys[n]
      if (seen[key]) continue
      seen[key] = true
      var scheme = schemeFromRaw(localStorage.getItem(key))
      if (scheme) return scheme
    }
    return 'dark'
  }

  var scheme = readScheme()
  var root = document.documentElement
  root.classList.remove('sepia')
  root.classList.toggle('dark', scheme === 'dark')
  root.style.colorScheme = scheme

  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta)
  {
    meta.setAttribute('content', scheme === 'dark' ? THEME_DARK : THEME_LIGHT)
  }
})()
