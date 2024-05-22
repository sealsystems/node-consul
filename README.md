# @sealsystems/consul

@sealsystems/consul provides service discovery based on Consul.

## Installation

```bash
npm install @sealsystems/consul
```

## Environment variables

- TLS_UNPROTECTED: possible values are `world`, `none`, `loopback`
- CONSUL_FORCE_TLS: always use TLS for communication with Consul, independent of the value of `TLS_UNPROTECTED`

## Quick start

First you need to add a reference to @sealsystems/consul within your application.

```javascript
const consul = require('@sealsystems/consul');
```

Then call `connect` to register your service with Consul.

```javascript
await consul.connect({
  id: 'my-service-id',
  name: 'my-service-name',
  serviceUrl: 'http://localhost:3000', // URL of my service
  consulUrl: 'http://localhost:8500', // URL of a Consul server
  dnsPort: '8600' // Optional non-default port of the DNS server
});

// Your service is now registered
```

You may omit the hostname of your service in `serviceUrl` (e.g. by setting it to `http://:3000`). In this case, your service is assumed to run on the same host as the Consul agent.

For the service, a new health check with a TTL of 10 seconds will be created. A heartbeat request will be sent every 5 seconds to Consul in order to prevent the TTL to expire.

By default, the status of a service is `warn`. Consul also recognizes the states `pass`and `fail`. Call the appropriate function, to change the state of your service. To set it to e.g. `pass`, use:

```javascript
await consul.pass();
```

To get all nodes providing a specific service, call `getNodes`. It uses the same interface as [node-consul's `consul.catalog.service.nodes` function](https://github.com/silas/node-consul#catalog-service-nodes).

## Watching a service

Use the `watch` function to receive notifications when the group of nodes that provide a service has been changed:

```javascript
const watch = consul.watch({
  serviceName: 'my-service-name', // Name of the service to watch
  consulUrl: 'http://localhost:8500' // URL of a Consul server
});

watch.on('change', (nodes) => {
  // The 'nodes' array contains data about all nodes that provide the watched service
});

watch.on('error', (err) => {
  // ...
})
```

The `change` event is raised whenever a new node provides the service or a node is no longer available. Only nodes with passing health checks are regarded as available. At the start of the watch, the event is also immediately raised with an array of all currently active nodes.

A node object contains the following properties:

- `host`: The address of the node
- `node`: Consul's node name
- `port`: The port used by the service

## Custom Consul domain

By default the domain `consul` will be used to resolve a service. E.g. the service `checkout` will be expanded to `checkout.service.consul`. If another domain is given in Consul's configuration, you must set the environment variable `CONSUL_DOMAIN` accordingly.

If you configure Consul to use e.g. `sealsystems.com` as the domain, you must also define this domain via the environment variable:

```bash
CONSUL_DOMAIN=sealsystems.com
```

This will change the expanded service name given above to: `checkout.service.sealsystems.com`

## Using in cloud environment

To enable cloud environment set the environment variable `SERVICE_DISCOVERY` to the value `cloud`. To disable cloud environment unset the variable or set it to the value `consul`. Additionally the environment variable `SERVICE_DISCOVERY_PORT` defines the https port all services are available. Default is `3000`.

## Initializing without connecting first

It is assumed that you call `consul.connect` first. This will establish the connection to the local Consul agent. The other functions (e.g. `consul.getHostname`) will throw an error if this connection has not been initialized.

If you do not want to register a service check via `consul.connect`, just call `consul.initialize` instead. This will only connect to the Consul agent. Now, you can  use most of the other functions.

Please note: `consul.heartbeat`, `consul.lookup`, `consul.resolveService` require `consul.connect` to be called. They will not work properly if you only call `consul.initialize`.

## Get configuration from consul kv store

To read configuration from consul kv store, you can use the `consul.setEnv` function. It will read all key-value pairs from the service path (starting with `dc/home/env/service/...`) and set them as environment variables. The path must be given without the leading slash.

```javascript
await consul.setEnv(options);
```

The method initializes the connection to the local Consul agent. The following options are available:

- `consulUrl`: The URL of a consul server.
- `consulConfig`: The path and filename to a JSON file, containing a `consul.address` property of format `host:port` like the `envconsul.json` file. Defaults to `/opt/seal/etc/envconsul.json` on linux and `$ProgrammData\SEAL Systems\config\envconsul.json` on windows.
- `defaultUrl`: The URL of a Consul server, if no other URL is given or the `consulConfig` file could not be read.
- `serviceName`: The name of the service to read the configuration for. If not given, the name of the service is read from the environment variable `SERVICE_NAME`.
- `serviceTags`: An array of service tags. If not given, the tags of the service are read from the environment variable `SERVICE_TAGS`. Tags are optional.
- `retries`: The number of retries to get the configuration from consul. Defaults to 10.

If no URL to a consul server could be determined an exception is thrown. It is recommended to set at least the `defaultUrl` option.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```bash
bot
```
