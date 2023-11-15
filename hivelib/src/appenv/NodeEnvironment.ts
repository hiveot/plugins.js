import * as os from 'os';
import fs from 'fs';
import path from 'path';
import { Logger } from 'tslog'
import yaml from 'yaml';
import { program } from 'commander';

const slog = new Logger({ name: "zwavejs" })

const DEFAULT_CA_CERT_FILE = "caCert.pem"


// AppEnvironment holds the running environment naming conventions.
// Intended for services and plugins.
// This contains folder locations, CA certificate and application clientID
export class NodeEnvironment extends Object {
    // Directories and files when running a nodejs application
    // Application binary folder, eg launcher, cli, ...
    binDir: string
    // Plugin folder
    pluginsDir: string
    // Home folder, default this is the parent of bin, config, certs and logs
    homeDir: string
    // config folder with application and configuration files
    configDir: string
    // Ca certificates and login key and token location
    certsDir: string
    // client's key pair file location
    keyFile: string
    // client's auth token file location
    tokenFile: string
    // Logging output
    logsDir: string
    // logging level
    loglevel: string
    // Root of the service stores
    storesDir: string

    // Server connection core determines the transport to use
    //Core string `yaml:"core"` // core to use, "nats" or "mqtt". empty for auto-detect

    // schema://address:port/ of the hub. Default is autodetect using DNS-SD
    hubURL: string

    // Credentials
    // CA cert, if loaded, in PEM format, used to verify hub server TLS connection
    caCertPEM: string
    // the clientID. Default is the application binary name - hostname
    // this must match with the issued credentials.
    clientID: string
    // the client's private/public key pair used in authentication
    clientKey: string
    // the client's authentication token
    clientToken: string


    // new NodeEnvironment returns the application environment including folders 
    // for use by the Hub services running nodejs.
    //
    // Optionally parse commandline flags:
    //
    //	-home  		alternative home directory. Default is the parent folder of the app binary
    //	-clientID  	alternative clientID. Default is the application binary name.
    //	-config     alternative config directory. Default is home/certs
    //	-configFile alternative application config file. Default is {clientID}.yaml
    //	-loglevel   debug, info, warning (default), error
    //	-server     optional server URL or "" for auto-detect
    //	-core       optional server core or "" for auto-detect
    //
    // The default 'user based' structure is:
    //
    //		home
    //		  |- bin                Core binaries
    //	      |- plugins            Plugin binaries
    //		  |- config             Service configuration yaml files
    //		  |- certs              CA and service certificates
    //		  |- logs               Logging output
    //		  |- run                PID files and sockets
    //		  |- stores
    //		      |- {service}      Store for service
    //
    // The system based folder structure is used when launched from a path starting
    // with /usr or /opt:
    //
    //	/opt/hiveot/bin            Application binaries, cli and launcher
    //	/opt/hiveot/plugins        Plugin binaries
    //	/etc/hiveot/conf.d         Service configuration yaml files
    //	/etc/hiveot/certs          CA and service certificates
    //	/var/log/hiveot            Logging output
    //	/run/hiveot                PID files and sockets
    //	/var/lib/hiveot/{service}  Storage of service
    //
    // This uses os.Args[0] application path to determine the home directory, which is the
    // parent of the application binary.
    // The default clientID is based on the binary name using os.Args[0].
    //
    //	homeDir to override the auto-detected or commandline paths. Use "" for defaults.
    //	withFlags parse the commandline flags for -home and -clientID
    constructor(clientID: string, homeDir: string, withFlags: boolean) {
        super();
        this.clientID = clientID
        this.homeDir = homeDir
        //serverCore := ""

        // startup defaults
        // debugger
        // Try to be smart about whether to use the system structure.
        // If the path starts with /opt or /usr then use
        // the system folder configuration. This might be changed in future if it turns
        // out not to be so smart at all.
        // Future: make this work on windows
        let useSystem = homeDir.startsWith("/usr") || homeDir.startsWith("/opt")
        if (useSystem) {
            this.homeDir = path.join("/var", "lib", "hiveot")
            this.binDir = path.join("/opt", "hiveot")
            this.pluginsDir = path.join(this.binDir, "plugins")
            this.configDir = path.join("/etc", "hiveot", "conf.d")
            this.certsDir = path.join("/etc", "hiveot", "certs")
            this.logsDir = path.join("/var", "log", "hiveot")
            this.storesDir = path.join("/var", "lib", "hiveot")
        } else { // use application parent dir
            //slog.Infof("homeDir is '%s", homeDir)
            this.homeDir = homeDir
            this.binDir = "bin"
            this.certsDir = "certs"
            this.configDir = "config"
            this.logsDir = "logs"
            this.pluginsDir = "plugins"
            this.storesDir = "stores"
        }
        this.loglevel = process.env["LOGLEVEL"] || "warning"
        this.hubURL = ""
        this.clientKey = ""
        this.clientToken = ""

        // default home folder is the parent of the core or plugin binary
        if (this.homeDir == "") {
            this.binDir = path.dirname(process.argv0)
            if (!path.isAbsolute(this.binDir)) {
                let cwd = process.cwd()
                this.binDir = path.join(cwd, this.binDir)
            }
            homeDir = path.join(this.binDir, "..")
        }

        // apply commandline options
        if (withFlags) {
            program
                .name('zwavejs')
                .description("HiveOT binding for the zwave protocol using zwavejs")
                .option('-c --config <string>', "override the location of the config file ")
                .option('-i, --clientID', "application client ID to authenticate as")
                .option('--home <string>', "override the HiveOT application home directory")
                .option('--certs <string>', "override service auth certificate directory")
                .option('--logs <string>', "override log-files directory")
                .option('--loglevel <string>', "'error', 'warn', 'info', 'debug'")
                .option('--server <string>', "server URL or empty for automatic discovery")
            program.parse();
            const options = program.opts()

            // option '--home' changes all paths
            if (options.home) {
                homeDir = options.home
            }
            // apply commandline overrides
            if (options.config) {
                // if a configfile is given then load it now as commandline overrides configfile
                this.loadConfigFile(options.config)
            }

            this.certsDir = (options.certs) ? options.certs : this.certsDir
            this.clientID = (options.clientID) ? options.clientID : clientID
            this.hubURL = options.server ? options.server : this.hubURL
            this.logsDir = (options.logs) ? options.logs : this.logsDir
            this.loglevel = (options.loglevel) ? options.loglevel : "warning"
        } else {
            let configFile = path.join(this.configDir, clientID + ".yaml")
            // try loading the config file
            this.loadConfigFile(configFile)
        }

        // make paths absolute
        if (!path.isAbsolute(homeDir)) {
            let cwd = process.cwd()
            homeDir = path.join(cwd, homeDir)
            this.homeDir = homeDir
        }
        if (!path.isAbsolute(this.certsDir)) {
            this.certsDir = path.join(homeDir, this.certsDir)
        }
        if (!path.isAbsolute(this.configDir)) {
            this.configDir = path.join(homeDir, this.configDir)
        }
        if (!path.isAbsolute(this.storesDir)) {
            this.storesDir = path.join(homeDir, this.storesDir)
        }


        // load the CA cert if found
        let caCertFile = path.join(this.certsDir, DEFAULT_CA_CERT_FILE)
        this.caCertPEM = fs.readFileSync(caCertFile).toString()

        // determine the expected location of the service auth key and token
        this.tokenFile = path.join(this.certsDir, clientID + ".token")
        this.keyFile = path.join(this.certsDir, clientID + ".key")

        // attempt to load the CA cert, client key, and auth token, if available in a file
        if (!this.caCertPEM) {
            let caCertFile = path.join(this.certsDir, "caCert.pem")
            this.caCertPEM = fs.readFileSync(caCertFile).toString()
        }
        if (!this.clientKey) {
            this.clientKey = fs.readFileSync(this.keyFile).toString()
        }
        if (!this.clientToken) {
            this.clientToken = fs.readFileSync(this.tokenFile).toString()
        }

    }


    // LoadConfigFile loads the application configuration 
    //
    // This throws an error if loading or parsing the config file fails.
    // Returns normally if the config file doesn't exist or is loaded successfully.
    public loadConfigFile(path: string): void {
        // TODO: support browser using local storage
        let cfgData: Buffer | undefined
        try {
            cfgData = fs.readFileSync(path)
            slog.info("Loaded configuration file", "configFile", path)
        } catch (e) {
            slog.info("Configuration file not found. Ignored.", "path", path)
        }

        if (cfgData) {
            let cfg: object = yaml.parse(cfgData.toString())
            let target: Object = this
            // iterate the attributes and apply
            Object.assign(this, cfg)
        }
    }
}

// // GetAppEnvironment returns the application environment including folders for use by the Hub services.
// //
// // Optionally parse commandline flags:
// //
// //	-home  		alternative home directory. Default is the parent folder of the app binary
// //	-clientID  	alternative clientID. Default is the application binary name.
// //	-config     alternative config directory. Default is home/certs
// //	-configFile alternative application config file. Default is {clientID}.yaml
// //	-loglevel   debug, info, warning (default), error
// //	-server     optional server URL or "" for auto-detect
// //	-core       optional server core or "" for auto-detect
// //
// // The default 'user based' structure is:
// //
// //		home
// //		  |- bin                Core binaries
// //	      |- plugins            Plugin binaries
// //		  |- config             Service configuration yaml files
// //		  |- certs              CA and service certificates
// //		  |- logs               Logging output
// //		  |- run                PID files and sockets
// //		  |- stores
// //		      |- {service}      Store for service
// //
// // The system based folder structure is used when launched from a path starting
// // with /usr or /opt:
// //
// //	/opt/hiveot/bin            Application binaries, cli and launcher
// //	/opt/hiveot/plugins        Plugin binaries
// //	/etc/hiveot/conf.d         Service configuration yaml files
// //	/etc/hiveot/certs          CA and service certificates
// //	/var/log/hiveot            Logging output
// //	/run/hiveot                PID files and sockets
// //	/var/lib/hiveot/{service}  Storage of service
// //
// // This uses os.Args[0] application path to determine the home directory, which is the
// // parent of the application binary.
// // The default clientID is based on the binary name using os.Args[0].
// //
// //	homeDir to override the auto-detected or commandline paths. Use "" for defaults.
// //	withFlags parse the commandline flags for -home and -clientID
// export function getAppEnv(homeDir: string, withFlags: boolean): AppEnvironment {
//     var configFile = ""
//     appenv.configDir = "config"
//     appenv.binDir = "bin"
//     appenv.pluginsDir = "plugins"
//     appenv.certsDir = "certs"
//     appenv.logsDir = "logs"
//     appenv.storesDir = "stores"
//     appenv.clientID = path.basename(process.argv0)
//     appenv.loglevel = process.env["LOGLEVEL"] || "warning"
//     appenv.hubURL = ""

//     //serverCore := ""
//     // startup defaults

//     // Try to be smart about whether to use the system structure.
//     // If the path starts with /opt or /usr then use
//     // the system folder configuration. This might be changed in future if it turns
//     // out not to be so smart at all.
//     // Future: make this work on windows
//     let useSystem = homeDir.startsWith("/usr") || homeDir.startsWith("/opt")
//     if (useSystem) {
//         homeDir = path.join("/var", "lib", "hiveot")
//         binDir = path.join("/opt", "hiveot")
//         pluginsDir = path.join(binDir, "plugins")
//         configDir = path.join("/etc", "hiveot", "conf.d")
//         certsDir = path.join("/etc", "hiveot", "certs")
//         logsDir = path.join("/var", "log", "hiveot")
//         storesDir = path.join("/var", "lib", "hiveot")
//     } else { // use application parent dir
//         //slog.Infof("homeDir is '%s", homeDir)
//         binDir = path.join(homeDir, "bin")
//         configDir = path.join(homeDir, "config")
//         certsDir = path.join(homeDir, "certs")
//         logsDir = path.join(homeDir, "logs")
//         pluginsDir = path.join(homeDir, "plugins")
//         storesDir = path.join(homeDir, "stores")
//     }
//     if (configFile == "") {
//         configFile = path.join(configDir, clientID + ".yaml")
//     }
//     // os.environ()

//     // default home folder is the parent of the core or plugin binary
//     if (homeDir == "") {
//         binDir = path.dirname(process.argv0)
//         if (!path.isAbsolute(binDir)) {
//             let cwd = process.cwd()
//             binDir = path.join(cwd, binDir)
//         }
//         homeDir = path.join(binDir, "..")
//     }
//     if (withFlags) {
//         program
//             .name('zwavejs')
//             .description("HiveOT binding for the zwave protocol using zwavejs")
//             .option('-c --config <string>', "override the location of the config file ")
//             .option('-i, --clientID', "application client ID to authenticate as")
//             .option('--home <string>', "override the HiveOT application home directory")
//             .option('--certs <string>', "override service auth certificate directory")
//             .option('--logs <string>', "override log-files directory")
//             .option('--loglevel <string>', "'error', 'warn', 'info', 'debug'")
//             .option('--server <string>', "server URL or empty for automatic discovery")
//         program.parse();
//         const options = program.opts()

//         // option '--home' changes all defaults
//         if (options.home) {
//             homeDir = options.home
//         }
//         // apply commandline overrides
//         configFile = (options.config) ? options.config : path.join(homeDir, "config", clientID + ".yaml")
//         clientID = (options.clientID) ? options.clientID : clientID
//         certsDir = (options.certs) ? options.certs : path.join(homeDir, "certs")
//         logsDir = (options.logs) ? options.logs : path.join(homeDir, "logs")
//         loglevel = (options.loglevel) ? options.loglevel : "warning"
//         serverURL = options.server ? options.server : "" // default is auto discover
//     }
//     // make paths absolute
//     if (!path.isAbsolute(homeDir)) {
//         let cwd = process.cwd()
//         homeDir = path.join(cwd, homeDir)
//     }
//     if (!path.isAbsolute(configDir)) {
//         configDir = path.join(homeDir, configDir)
//     }
//     if (!path.isAbsolute(certsDir)) {
//         certsDir = path.join(homeDir, certsDir)
//     }
//     if (!path.isAbsolute(storesDir)) {
//         storesDir = path.join(homeDir, storesDir)
//     }
//     if (!path.isAbsolute(configFile)) {
//         configFile = path.join(configDir, configFile)
//     }

//     // load the CA cert if found
//     let caCertFile = path.join(certsDir, DEFAULT_CA_CERT_FILE)
//     let caCertPEM = fs.readFileSync(caCertFile).toString()

//     // determine the expected location of the service auth key and token
//     let tokenFile = path.join(certsDir, clientID + ".token")
//     let keyFile = path.join(certsDir, clientID + ".key")

//     let appenv = new AppEnvironment()
//     appenv.binDir = binDir
//     appenv.pluginsDir = pluginsDir
//     appenv.homeDir = homeDir
//     appenv.configDir = configDir
//     appenv.configFile = configFile
//     appenv.certsDir = certsDir
//     appenv.logsDir = logsDir
//     appenv.logLevel = loglevel
//     appenv.storesDir = storesDir
//     appenv.clientID = clientID
//     appenv.keyFile = keyFile
//     appenv.tokenFile = tokenFile
//     appenv.caCertPEM = caCertPEM
//     //appenv.core:   serverCore,
//     appenv.hubURL = serverURL
//     return appenv
// }