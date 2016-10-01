const readline = require('readline')
const config = require('./config')
const fs = require('fs')
const exec = require('child_process').exec
const portsFile = __dirname + '/config/ports.json'
const ports = require(portsFile)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const makeDir = (dir) => {
  if (dir === config.basePath) {
    process.exit(1)
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

const getResult1 = (url) => {
  url = url.replace(/\s/g, '')
  const tmp = url.replace('.git', '')
  const dirName = tmp.substr(tmp.lastIndexOf('/') + 1)
  const result = {
    url: url,
    dirName: `${config.basePath}${dirName}`
  }
  return result
}

const githubInput = (cb) => {
  rl.question('Github URL: ', (url) => {
    const opts = getResult1(url)
    rl.pause()
    return cb(opts)
  })
}

const dnsInput = (cb) => {
  rl.resume()
  rl.question('DNS: ', (dns) => {
    return cb(dns)
  })
}

const writeFile = (opts, cb) => {
  newPort = {
    port: opts.port
  }
  fs.writeFile(portsFile, JSON.stringify(newPort), (err) => {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    return cb()
  })
}

const updateDns = (opts, cb) => {
  const dns = opts.dns.replace(`.${config.rootDomain}`, '')
  const cmd = `sh ${__dirname}/updateDns.sh ${config.serverIp} ${dns} ${config.rootDomain} ${config.username} ${config.password} ${config.id}`
  exec(cmd, function(err, stdout, stderr) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    console.log(`Added DNS pointer: ${opts.dns}`)
    cb()
  })
}

const cloneGit = (opts, cb) => {
  makeDir(opts.dirName)
  const cmd = `git clone ${opts.url} ${opts.dirName}`
  exec(cmd, function(err, stdout, stderr) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    console.log(`Cloned: ${opts.url} to ${opts.dirName}`)
    cb()
  })
}

const giveEnvs = (opts) => {
  console.log(`VIRTUAL_HOST=${opts.dns}`)
  console.log(`VIRTUAL_IP=${config.virtualIp}`)
  console.log(`VIRTUAL_PORT=${opts.port}`)
  console.log(`cd ${opts.dirName}`)
}

const doJobs = (opts, cb) => {
  cloneGit(opts, () => {
    updateDns(opts, () => {
      writeFile(opts, () => {
        giveEnvs(opts)
        cb()
      })
    })
  })
}

githubInput((opts) => {
  dnsInput((dns) => {
    opts.dns = dns
    opts.port = ports.port + 1
    console.log(opts)
    doJobs(opts, () => {
      process.exit(0)
    })
  })
})
