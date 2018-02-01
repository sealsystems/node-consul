# @sealsystems/consul

[![CircleCI](https://circleci.com/gh/sealsystems/seal-consul.svg?style=svg)](https://circleci.com/gh/sealsystems/seal-consul)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/3y40yyflrpw10hao?svg=true)](https://ci.appveyor.com/project/Plossys/seal-consul)

@sealsystems/consul provides service discovery based on Consul.

## Installation

```bash
npm install @sealsystems/consul
```

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
  consulUrl: 'http://localhost:8500' // URL of a Consul server
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

## Initializing without connecting first

It is assumed that you call `consul.connect` first. This will establish the connection to the local Consul agent. The other functions (e.g. `consul.getHostname`) will throw an error if this connection has not been initialized.

If you do not want to register a service check via `consul.connect`, just call `consul.initialize` instead. This will only connect to the Consul agent. Now, you can  use most of the other functions.

Please note: `consul.heartbeat`, `consul.lookup`, `consul.resolveService` require `consul.connect` to be called. They will not work properly if you only call `consul.initialize`.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```bash
$ bot
```
