BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[TicketEvent] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ticketId] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [payload] NVARCHAR(max) NOT NULL,
    [actorId] UNIQUEIDENTIFIER,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketEvent_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketEvent_ticketId_createdAt_idx] ON [dbo].[TicketEvent]([ticketId], [createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[TicketEvent] ADD CONSTRAINT [TicketEvent_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
