const pipeline = [
    { $limit: 1 },
    {
        $project: { _id: 1 }
    },
    {
        $project: { _id: 0 }
    },
    {
        $lookup: {
            from: 'request-log',
            as: 'keyBased',
            pipeline: [
                {
                    $match: {
                        key: { $ne: null },
                        $expr: { $gte: ['$time', { $subtract: [{ $toLong: '$$NOW' }, 1000 * 60] }]}
                    }
                },
                {
                    $group: {
                        _id: {
                            key: '$key',
                            interval: { $subtract: ['$time', { $mod: ['$time', 1000 * 10] }]}
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        count: { $gte: 10 }
                    }
                },
                {
                    $project: {
                        key: '$_id.key',
                        until: { $add: [{ $toLong: '$$NOW' }, 1000 * 60 * 15] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        count: 0
                    }
                }
            ]
        }
    },
    {
        $lookup: {
            from: 'request-log',
            as: 'ipBased',
            pipeline: [
                {
                    $match: {
                        $expr: { $gte: ['$time', { $subtract: [{ $toLong: '$$NOW' }, 1000 * 60] }]}
                    }
                },
                {
                    $group: {
                        _id: {
                            ip: '$ip',
                            interval: { $subtract: ['$time', { $mod: ['$time', 1000 * 10] }]}
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        count: { $gte: 10 }
                    }
                },
                {
                    $project: {
                        ip: '$_id.ip',
                        until: { $add: [{ $toLong: '$$NOW' }, 1000 * 60 * 15] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        count: 0
                    }
                }
            ]
        }
    },
    {
        $lookup: {
            from: 'limited-log-mview',
            as: 'previous',
            pipeline: [
                {
                    $match: {
                        $expr: { $gte: ['$until', { $subtract: [{ $toLong: '$$NOW' }, 1000 * 60 * 30] }]}
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        }
    },
    {
        $project: {
            union: { $concatArrays: ['$keyBased', '$ipBased', '$previous'] }
        }
    },
    {
        $unwind: {
            path: '$union'
        }
    },
    {
        $replaceRoot: {
            newRoot: '$union'
        }
    },
    {
        $group: {
            _id: {
                ip: '$ip',
                key: '$key'
            },
            count: {
                $sum: 1
            },
            until: {
                $first: '$until'
            }
        }
    },
    {
        $set: {
            until: {
                $cond: {
                    if: { $ne: ['$count', 1] },
                    then: { $add: [{ $toLong: '$$NOW' }, 1000 * 60 * 60] },
                    else: '$until'
                }
            },
            ip: '$_id.ip',
            key: '$_id.key'
        }
    },
    {
        $project: {
            count: 0,
            _id: 0
        }
    },
    {
        $out: 'limited-log-mview'
    }
];

exports = function() {
  context.services.get('mars-1').db('hscc-api-elections').collection('request-log').aggregate(pipeline);
};
