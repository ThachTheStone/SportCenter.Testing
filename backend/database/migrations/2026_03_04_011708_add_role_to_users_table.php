<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'coach', 'client', 'visiteur'])->default('visiteur')->after('email');
            $table->boolean('active')->default(true)->after('role');
            $table->integer('failed_login_attempts')->default(0)->after('active');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'active', 'failed_login_attempts', 'locked_until']);
            $table->dropSoftDeletes();
        });
    }
};
