require('dotenv').config();

const express = require("express");
const cors = require('cors');
console.log(process.env.SUPABASE_URL);
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());

app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get("/", (req, res) => {
    res.send("Intelock 2FA Server Running");
});

app.post("/heartbeat", async (req, res) => {

    const { lock_id, status, battery_percentage, signal_strength } = req.body;

const { error } = await supabase
    .from("heartbeat_records")
    .insert({
        lock_id,
        status,
        battery_percentage,
        signal_strength
    });
    
    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        message: "Heartbeat received"
    });

});

app.post("/unlock", async (req, res) => {

    const { lock_id, user_id } = req.body;

    const { error } = await supabase
        .from("unlock_requests")
        .insert({
            lock_id,
            user_id,
            status: "pending"
        });

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        message: "Unlock request created"
    });

});

app.post('/unlock', async (req, res) => {

    const { lock_id, expires_at } = req.body;

    const { error } = await supabase
        .from('unlock_requests')
        .insert({
            lock_id,
            status: 'pending',
            expires_at
        });

    if (error) {
        return res.status(500).json({
            error: error.message
        });
    }

    res.json({
        success: true,
        message: 'Unlock request created'
    });
});

app.post('/create-unlock-request', async (req, res) => {

    const { lock_id } = req.body;

    const { error } = await supabase
        .from('unlock_requests')
        .insert({
            lock_id,
            status: 'pending',
            expires_at: new Date(Date.now() + 60000).toISOString()
        });

    if (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }

    res.json({
        success: true,
        message: 'Unlock request created'
    });
});

app.post('/approve-request', async (req, res) => {

    const { request_id } = req.body;

    const { error } = await supabase
        .from('unlock_requests')
        .update({
            status: 'approved'
        })
        .eq('id', request_id);

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        message: 'Request approved'
    });
});

app.post('/approve-request', async (req, res) => {

    const { request_id, resolved_by } = req.body;

    const { error } = await supabase
        .from('unlock_requests')
        .update({
            status: 'approved',
            resolved_at: new Date().toISOString(),
            resolved_by
        })
        .eq('id', request_id);

    if (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }

    res.json({
        success: true
    });
});

app.post('/reject-request', async (req, res) => {

    const { request_id, resolved_by } = req.body;

    const { error } = await supabase
        .from('unlock_requests')
        .update({
            status: 'rejected',
            resolved_at: new Date().toISOString(),
            resolved_by
        })
        .eq('id', request_id);

    if (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }

    res.json({
        success: true
    });
});

app.get('/check-unlock/:lockId', async (req, res) => {

    const { lockId } = req.params;

    const { data, error } = await supabase
        .from('unlock_requests')
        .select('*')
        .eq('lock_id', lockId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .limit(1);

    if (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }

    if (data.length === 0) {

        return res.json({
            approved: false
        });

    }

    res.json({
        approved: true,
        request_id: data[0].id
    });

});

app.post('/complete-request', async (req, res) => {

    const { request_id } = req.body;

    const { error } = await supabase
        .from('unlock_requests')
        .update({
            status: 'completed'
        })
        .eq('id', request_id);

    if (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }

    res.json({
        success: true
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});