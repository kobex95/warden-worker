import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper function to create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Helper function to verify JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Main handler
export async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  console.log(`${method} ${path}`);

  try {
    // Health check
    if (path === '/api/health') {
      return jsonResponse({ status: 'ok' });
    }

    // Prelogin endpoint
    if (path === '/identity/accounts/prelogin' && method === 'POST') {
      const body = await request.json();
      const { email } = body;

      const { data: user, error } = await supabase
        .from('users')
        .select('kdf_type, kdf_iterations')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        return jsonResponse({
          kdf: 0,
          kdfIterations: 600000
        });
      }

      return jsonResponse({
        kdf: user.kdf_type,
        kdfIterations: user.kdf_iterations
      });
    }

    // Register endpoint
    if (path === '/identity/accounts/register/finish' && method === 'POST') {
      const body = await request.json();
      const {
        name,
        email,
        masterPasswordHash,
        masterPasswordHint,
        userSymmetricKey,
        userAsymmetricKeys,
        kdf,
        kdfIterations
      } = body;

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name,
          email: email.toLowerCase(),
          email_verified: true,
          master_password_hash: masterPasswordHash,
          master_password_hint: masterPasswordHint,
          key: userSymmetricKey,
          private_key: userAsymmetricKeys.encryptedPrivateKey,
          public_key: userAsymmetricKeys.publicKey,
          kdf_type: kdf,
          kdf_iterations: kdfIterations,
          security_stamp: crypto.randomUUID(),
          created_at: now,
          updated_at: now
        });

      if (error) {
        console.error('Registration error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({ success: true });
    }

    // Token endpoint
    if (path === '/identity/connect/token' && method === 'POST') {
      const body = await request.json();
      const { grant_type, username, password, refresh_token } = body;

      if (grant_type === 'password') {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', username.toLowerCase())
          .single();

        if (error || !user) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        if (user.master_password_hash !== password) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const accessToken = jwt.sign(
          {
            sub: user.id,
            exp: Math.floor(Date.now() / 1000) + 3600,
            nbf: Math.floor(Date.now() / 1000),
            premium: true,
            name: user.name || 'User',
            email: user.email,
            email_verified: user.email_verified,
            amr: ['Application']
          },
          JWT_SECRET
        );

        const refreshToken = jwt.sign(
          {
            sub: user.id,
            exp: Math.floor(Date.now() / 1000) + 2592000,
            nbf: Math.floor(Date.now() / 1000),
            premium: true,
            name: user.name || 'User',
            email: user.email,
            email_verified: user.email_verified,
            amr: ['Application']
          },
          JWT_REFRESH_SECRET
        );

        return jsonResponse({
          access_token: accessToken,
          expires_in: 3600,
          token_type: 'Bearer',
          refresh_token: refreshToken,
          Key: user.key,
          PrivateKey: user.private_key,
          Kdf: user.kdf_type,
          ResetMasterPassword: false,
          ForcePasswordReset: false,
          UserDecryptionOptions: {
            hasMasterPassword: true,
            object: 'userDecryptionOptions'
          }
        });

      } else if (grant_type === 'refresh_token') {
        try {
          const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET);

          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.sub)
            .single();

          if (error || !user) {
            return jsonResponse({ error: 'Invalid refresh token' }, 401);
          }

          const accessToken = jwt.sign(
            {
              sub: user.id,
              exp: Math.floor(Date.now() / 1000) + 3600,
              nbf: Math.floor(Date.now() / 1000),
              premium: true,
              name: user.name || 'User',
              email: user.email,
              email_verified: user.email_verified,
              amr: ['Application']
            },
            JWT_SECRET
          );

          const newRefreshToken = jwt.sign(
            {
              sub: user.id,
              exp: Math.floor(Date.now() / 1000) + 2592000,
              nbf: Math.floor(Date.now() / 1000),
              premium: true,
              name: user.name || 'User',
              email: user.email,
              email_verified: user.email_verified,
              amr: ['Application']
            },
            JWT_REFRESH_SECRET
          );

          return jsonResponse({
            access_token: accessToken,
            expires_in: 3600,
            token_type: 'Bearer',
            refresh_token: newRefreshToken,
            Key: user.key,
            PrivateKey: user.private_key,
            Kdf: user.kdf_type,
            ResetMasterPassword: false,
            ForcePasswordReset: false,
            UserDecryptionOptions: {
              hasMasterPassword: true,
              object: 'userDecryptionOptions'
            }
          });
        } catch (error) {
          return jsonResponse({ error: 'Invalid refresh token' }, 401);
        }
      } else {
        return jsonResponse({ error: 'Unsupported grant_type' }, 400);
      }
    }

    // Sync endpoint (requires authentication)
    if (path === '/api/sync' && method === 'GET') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Fetch ciphers
      const { data: ciphers, error: ciphersError } = await supabase
        .from('ciphers')
        .select('*')
        .eq('user_id', userId);

      // Fetch folders
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId);

      return jsonResponse({
        object: 'sync',
        User: {
          ...userData,
          object: 'user'
        },
        Ciphers: (ciphers || []).map(c => ({
          ...c,
          object: 'cipher',
          data: JSON.parse(c.data),
          favorite: c.favorite ? true : false,
          edit: true,
          viewPassword: true,
          organizationUseTotp: false
        })),
        Folders: (folders || []).map(f => ({
          ...f,
          object: 'folder'
        })),
        Profile: {
          object: 'profile',
          userId: userId,
          hasPremium: true
        }
      });
    }

    // Create cipher
    if (path === '/api/ciphers/create' && method === 'POST') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;
      const { cipher, collectionIds = [] } = await request.json();

      const now = new Date().toISOString();
      const cipherId = crypto.randomUUID();

      const { error } = await supabase
        .from('ciphers')
        .insert({
          id: cipherId,
          user_id: userId,
          organization_id: cipher.organizationId || null,
          type: cipher.type,
          data: JSON.stringify({
            name: cipher.name,
            notes: cipher.notes,
            login: cipher.login,
            card: cipher.card,
            identity: cipher.identity,
            secureNote: cipher.secureNote,
            fields: cipher.fields,
            passwordHistory: cipher.passwordHistory,
            reprompt: cipher.reprompt
          }),
          favorite: cipher.favorite ? 1 : 0,
          folder_id: cipher.folderId || null,
          deleted_at: null,
          created_at: now,
          updated_at: now
        });

      if (error) {
        console.error('Create cipher error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({
        ...cipher,
        id: cipherId,
        userId: userId,
        object: 'cipher',
        edit: true,
        viewPassword: true,
        organizationUseTotp: false,
        collectionIds: collectionIds.length > 0 ? collectionIds : null,
        revisionDate: now,
        creationDate: now,
        deletedDate: null
      });
    }

    // Update cipher
    if (path.match(/^\/api\/ciphers\/[^/]+$/) && method === 'PUT') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;
      const cipherId = path.split('/').pop();
      const cipher = await request.json();

      const now = new Date().toISOString();

      const { data: existing, error: fetchError } = await supabase
        .from('ciphers')
        .select('*')
        .eq('id', cipherId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        return jsonResponse({ error: 'Cipher not found' }, 404);
      }

      const { error } = await supabase
        .from('ciphers')
        .update({
          organization_id: cipher.organizationId || null,
          type: cipher.type,
          data: JSON.stringify({
            name: cipher.name,
            notes: cipher.notes,
            login: cipher.login,
            card: cipher.card,
            identity: cipher.identity,
            secureNote: cipher.secureNote,
            fields: cipher.fields,
            passwordHistory: cipher.passwordHistory,
            reprompt: cipher.reprompt
          }),
          favorite: cipher.favorite ? 1 : 0,
          folder_id: cipher.folderId || null,
          updated_at: now
        })
        .eq('id', cipherId)
        .eq('user_id', userId);

      if (error) {
        console.error('Update cipher error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({
        ...cipher,
        id: cipherId,
        userId: userId,
        object: 'cipher',
        edit: true,
        viewPassword: true,
        organizationUseTotp: false,
        collectionIds: null,
        revisionDate: now,
        creationDate: existing.created_at,
        deletedDate: null
      });
    }

    // Delete cipher
    if (path.match(/^\/api\/ciphers\/[^/]+\/delete$/) && method === 'PUT') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;
      const cipherId = path.split('/')[3];

      const { error } = await supabase
        .from('ciphers')
        .delete()
        .eq('id', cipherId)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete cipher error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({});
    }

    // Create folder
    if (path === '/api/folders' && method === 'POST') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;
      const { name } = await request.json();

      const now = new Date().toISOString();
      const folderId = crypto.randomUUID();

      const { error } = await supabase
        .from('folders')
        .insert({
          id: folderId,
          user_id: userId,
          name: name,
          created_at: now,
          updated_at: now
        });

      if (error) {
        console.error('Create folder error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({
        id: folderId,
        userId: userId,
        name: name,
        object: 'folder',
        revisionDate: now,
        creationDate: now
      });
    }

    // Update folder
    if (path.match(/^\/api\/folders\/[^/]+$/) && method === 'PUT') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;
      const folderId = path.split('/').pop();
      const { name } = await request.json();

      const now = new Date().toISOString();

      const { data: existing, error: fetchError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        return jsonResponse({ error: 'Folder not found' }, 404);
      }

      const { error } = await supabase
        .from('folders')
        .update({
          name: name,
          updated_at: now
        })
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) {
        console.error('Update folder error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({
        id: folderId,
        userId: userId,
        name: name,
        object: 'folder',
        revisionDate: now,
        creationDate: existing.created_at
      });
    }

    // Delete folder
    if (path.match(/^\/api\/folders\/[^/]+$/) && method === 'DELETE') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return jsonResponse({ error: 'Access token required' }, 401);
      }

      const user = verifyToken(token);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 403);
      }

      const userId = user.sub;
      const folderId = path.split('/').pop();

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete folder error:', error);
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({});
    }

    // Config endpoint
    if (path === '/api/config' && method === 'GET') {
      return jsonResponse({
        object: 'config',
        version: '1.0.0',
        server: {
          name: 'Warden',
          url: process.env.SERVER_URL || 'https://warden.pages.dev'
        },
        environment: {
          vault: 'https://vault.bitwarden.com',
          api: 'https://api.bitwarden.com',
          identity: 'https://identity.bitwarden.com',
          icons: 'https://icons.bitwarden.com',
          notifications: 'https://notifications.bitwarden.com',
          events: 'https://events.bitwarden.com'
        },
        device: {
          type: 0
        },
        gitHash: 'unknown',
        version: '1.0.0'
      });
    }

    // Send verification email
    if (path === '/identity/accounts/register/send-verification-email' && method === 'POST') {
      return jsonResponse({ success: true });
    }

    // 404 - Not Found
    return jsonResponse({ error: 'Not found' }, 404);

  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// Default export for EdgeOne
export default {
  fetch: handler,
};
