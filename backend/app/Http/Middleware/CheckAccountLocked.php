<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAccountLocked
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->isLocked()) {
            return response()->json([
                'message' => 'Account temporarily locked after several failed attempts. Try again in 30 minutes.',
            ], 423);
        }

        return $next($request);
    }
}
