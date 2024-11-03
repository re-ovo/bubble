const resourceVersionSymbol = Symbol('resourceVersion');

export interface Resource {
    [resourceVersionSymbol]: number;
}

function notifyResourceUpdate(resource: Resource) {
    resource[resourceVersionSymbol]++;
}

function isResource(obj: any): obj is Resource {
    return obj && obj[resourceVersionSymbol] !== undefined;
}


function getResourceVersion(resource: Resource): number {
    return resource[resourceVersionSymbol];
}

export {
    resourceVersionSymbol,
    notifyResourceUpdate,
    isResource,
    getResourceVersion
};
