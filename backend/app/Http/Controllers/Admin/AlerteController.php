<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;

class AlerteController extends Controller
{
    public function index()
    {
        $notifications = AdminNotification::orderBy('created_at', 'desc')->get();
        $non_lues      = $notifications->where('lu', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'non_lues'      => $non_lues,
        ]);
    }

    public function marquerLu($id)
    {
        AdminNotification::findOrFail($id)->update(['lu' => true]);
        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function marquerToutLu()
    {
        AdminNotification::where('lu', false)->update(['lu' => true]);
        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
