const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json(containers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// For basic health check
app.get('/', (req, res) => {
    res.send('DomainQA Monitoring Agent Running');
});

const PORT = 9100;
app.listen(PORT, () => {
    console.log(`Monitoring agent listening on port ${PORT}`);
});
