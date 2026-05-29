BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [passwordHash] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [role] NVARCHAR(20) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'USER',
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Ticket] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Ticket_status_df] DEFAULT 'OPEN',
    [priority] NVARCHAR(20) NOT NULL CONSTRAINT [Ticket_priority_df] DEFAULT 'MEDIUM',
    [assigneeId] UNIQUEIDENTIFIER,
    [createdById] UNIQUEIDENTIFIER NOT NULL,
    [lastActivityAt] DATETIME2 NOT NULL CONSTRAINT [Ticket_lastActivityAt_df] DEFAULT CURRENT_TIMESTAMP,
    [slaDueAt] DATETIME2,
    [autoReassignCount] INT NOT NULL CONSTRAINT [Ticket_autoReassignCount_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ticket_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Ticket_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketAssignment] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ticketId] UNIQUEIDENTIFIER NOT NULL,
    [fromUserId] UNIQUEIDENTIFIER,
    [toUserId] UNIQUEIDENTIFIER NOT NULL,
    [reason] NVARCHAR(20) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketAssignment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketAssignment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_role_idx] ON [dbo].[User]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_status_slaDueAt_idx] ON [dbo].[Ticket]([status], [slaDueAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_assigneeId_idx] ON [dbo].[Ticket]([assigneeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketAssignment_ticketId_idx] ON [dbo].[TicketAssignment]([ticketId]);

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_createdById_fkey] FOREIGN KEY ([createdById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAssignment] ADD CONSTRAINT [TicketAssignment_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAssignment] ADD CONSTRAINT [TicketAssignment_fromUserId_fkey] FOREIGN KEY ([fromUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAssignment] ADD CONSTRAINT [TicketAssignment_toUserId_fkey] FOREIGN KEY ([toUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
