<?php

namespace App\Policies;

use App\Models\Atalaya\User;
use App\Models\StatusesByView;
use Illuminate\Auth\Access\Response;

class StatusesByViewPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        //
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, StatusesByView $statusesByView): bool
    {
        //
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        //
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, StatusesByView $statusesByView): bool
    {
        //
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, StatusesByView $statusesByView): bool
    {
        //
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, StatusesByView $statusesByView): bool
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, StatusesByView $statusesByView): bool
    {
        //
    }
}
