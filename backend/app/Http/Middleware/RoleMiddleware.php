<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Not authenticated.'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json(['message' => 'Access denied. Insufficient permission.'], 403);
        }

        return $next($request);
    }
}
